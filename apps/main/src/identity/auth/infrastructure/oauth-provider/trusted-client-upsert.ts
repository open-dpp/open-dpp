import type { Logger } from "@nestjs/common";
import type { TrustedClientEnv } from "@open-dpp/env";
import type { Where } from "better-auth";
import type { Db } from "mongodb";
import { hashClientSecret } from "./client-secret";
import {
  OAUTH_PROVIDER_GRANT_TYPES,
  OAUTH_PROVIDER_SCOPES,
} from "../../domain/trusted-client-access-token";

/** The OAuth Provider plugin's client model; the mongo adapter uses the name as collection. */
export const OAUTH_CLIENT_MODEL = "oauthClient";

/**
 * The subset of better-auth's internal `DBAdapter` the upsert needs, declared
 * structurally: the plugin's own client endpoints are unusable at startup (they need a
 * user session, generate the client id and refuse system-owned rows).
 */
export interface OAuthClientAdapter {
  findOne(data: { model: string; where: Where[] }): Promise<unknown>;
  create(data: { model: string; data: Record<string, unknown> }): Promise<unknown>;
  update(data: {
    model: string;
    where: Where[];
    update: Record<string, unknown>;
  }): Promise<unknown>;
}

/**
 * The stored shape of the one Trusted Client: a confidential web client with PKCE,
 * no consent step and the fixed scope list. Field names are the plugin's schema names.
 */
export function buildTrustedClientRow(trustedClient: TrustedClientEnv) {
  return {
    clientId: trustedClient.clientId,
    clientSecret: hashClientSecret(trustedClient.clientSecret),
    name: trustedClient.clientName ?? trustedClient.clientId,
    redirectUris: [...trustedClient.redirectUris],
    tokenEndpointAuthMethod: "client_secret_basic",
    grantTypes: [...OAUTH_PROVIDER_GRANT_TYPES],
    responseTypes: ["code"],
    type: "web",
    public: false,
    skipConsent: true,
    requirePKCE: true,
    scopes: [...OAUTH_PROVIDER_SCOPES],
    disabled: false,
  };
}

/** MongoDB's error code for a unique-index violation. */
const DUPLICATE_KEY_ERROR_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === DUPLICATE_KEY_ERROR_CODE
  );
}

/**
 * The mongo adapter creates no indexes, so the uniqueness the plugin declares on
 * `clientId` has to come from the app. It is what makes two replicas booting at once
 * converge on one row (the loser's insert fails and turns into an update). Idempotent;
 * a failure is logged and the upsert still runs on a best-effort basis.
 */
async function ensureClientIdUniqueIndex(db: Db, logger: Logger): Promise<void> {
  try {
    await db.collection(OAUTH_CLIENT_MODEL).createIndex({ clientId: 1 }, { unique: true });
  } catch (error) {
    logger.warn(
      `Could not create the unique index on ${OAUTH_CLIENT_MODEL}.clientId; concurrent first boots may duplicate the Trusted Client`,
      error,
    );
  }
}

type UpsertOutcome = "created" | "updated";

async function upsertTrustedClient(
  adapter: OAuthClientAdapter,
  trustedClient: TrustedClientEnv,
): Promise<UpsertOutcome> {
  const where: Where[] = [{ field: "clientId", value: trustedClient.clientId }];
  const now = new Date();
  const row = buildTrustedClientRow(trustedClient);
  const refresh = () =>
    adapter.update({ model: OAUTH_CLIENT_MODEL, where, update: { ...row, updatedAt: now } });

  const existing = await adapter.findOne({ model: OAUTH_CLIENT_MODEL, where });
  if (existing) {
    await refresh();
    return "updated";
  }
  try {
    await adapter.create({
      model: OAUTH_CLIENT_MODEL,
      data: { ...row, createdAt: now, updatedAt: now },
    });
    return "created";
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }
    // a sibling replica inserted the row between the lookup and the insert
    await refresh();
    return "updated";
  }
}

/**
 * Creates or refreshes the env-configured Trusted Client so the operator never touches
 * the database. Runs on every enabled boot, before the first request: the plugin caches
 * trusted clients process-wide on first use, so changes only ever land at startup.
 */
export async function ensureTrustedClientUpserted(
  db: Db,
  adapter: OAuthClientAdapter,
  trustedClient: TrustedClientEnv,
  logger: Logger,
): Promise<void> {
  await ensureClientIdUniqueIndex(db, logger);
  try {
    const outcome = await upsertTrustedClient(adapter, trustedClient);
    logger.log(`Trusted Client "${trustedClient.clientId}" ${outcome}`);
  } catch (error) {
    // the rest of the instance must stay up; the OAuth Provider answers invalid_client until the next boot
    logger.error(
      `Failed to upsert the Trusted Client "${trustedClient.clientId}"; OAuth Provider requests are rejected until the next boot`,
      error,
    );
  }
}
