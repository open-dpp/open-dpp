import { randomUUID } from "node:crypto";
import {
  baseUrlOrigin,
  buildGs1DigitalLink,
  type Gs1IdentityResponse,
  Gs1IdentityDtoSchema,
  isValidCset82Component,
  normalizeToGtin14,
  UniqueProductIdentifierType,
  type UniqueProductIdentifierTypeValue,
} from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";

/**
 * The GS1 identity value object carried by a `GS1` UPI.
 *
 * A GTIN (always stored normalized to GTIN-14) plus an optional batch (AI `10`)
 * and/or serial (AI `21`), each a CSET-82 string of at most 20 characters.
 * Granularity is implied by which keys are present.
 */
export interface Gs1Identity {
  readonly gtin: string;
  readonly batch?: string;
  readonly serial?: string;
}

/** Raw, manufacturer-supplied GS1 identity input (un-normalized). */
export interface Gs1IdentityInput {
  gtin: string;
  batch?: string | null;
  serial?: string | null;
}

function normalizeGtinOrThrow(rawGtin: string): string {
  try {
    return normalizeToGtin14(rawGtin);
  } catch (error) {
    throw new ValueError(error instanceof Error ? error.message : "Invalid GTIN");
  }
}

/**
 * Normalize an optional batch / serial: trim, treat a blank value as absent, and
 * validate a non-blank value against CSET-82 and the length cap.
 *
 * @throws ValueError on an invalid (non-blank) component.
 */
function normalizeOptionalComponentOrThrow(
  value: string | null | undefined,
  label: string,
): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (!isValidCset82Component(trimmed)) {
    throw new ValueError(
      `${label} must contain only GS1 CSET-82 characters and be at most 20 characters`,
    );
  }
  return trimmed;
}

/**
 * Assemble a GS1 identity, including the batch (AI `10`) and serial (AI `21`) keys
 * only when present. The single home for the conditional `{ gtin, ...batch?, ...serial? }`
 * shape, shared by raw-input normalization and DB hydration — hence the tolerant
 * `null | undefined` accepted for each optional component.
 */
function assembleGs1Identity(
  gtin: string,
  batch: string | null | undefined,
  serial: string | null | undefined,
): Gs1Identity {
  return {
    gtin,
    ...(batch !== null && batch !== undefined ? { batch } : {}),
    ...(serial !== null && serial !== undefined ? { serial } : {}),
  };
}

/** Build a normalized, validated GS1 identity value object from raw input. */
function normalizeGs1Identity(input: Gs1IdentityInput): Gs1Identity {
  const gtin = normalizeGtinOrThrow(input.gtin);
  const batch = normalizeOptionalComponentOrThrow(input.batch, "Batch");
  const serial = normalizeOptionalComponentOrThrow(input.serial, "Serial");
  return assembleGs1Identity(gtin, batch, serial);
}

export class UniqueProductIdentifier {
  public readonly uuid: string;
  public readonly referenceId: string;
  public readonly type: UniqueProductIdentifierTypeValue;
  public readonly gs1?: Gs1Identity;
  public readonly organizationId: string | null;

  private constructor(
    uuid: string,
    referenceId: string,
    type: UniqueProductIdentifierTypeValue,
    gs1?: Gs1Identity,
    organizationId: string | null = null,
  ) {
    this.uuid = uuid;
    this.referenceId = referenceId;
    this.type = type;
    this.gs1 = gs1;
    this.organizationId = organizationId;
    this.assertInvariants();
  }

  private assertInvariants(): void {
    if (this.type === UniqueProductIdentifierType.GS1) {
      if (!this.gs1) {
        throw new ValueError("A GS1 unique product identifier must carry a GS1 identity (gtin)");
      }
      // Re-validate the stored GTIN-14 shape/check digit and the optional
      // batch/serial charset & length.
      Gs1IdentityDtoSchema.parse(this.gs1);
    } else if (this.gs1) {
      throw new ValueError(
        `A unique product identifier of type ${this.type} must not carry a GS1 identity`,
      );
    }
  }

  static create(data: {
    externalUUID?: string;
    referenceId: string;
    type?: UniqueProductIdentifierTypeValue;
    organizationId?: string | null;
  }): UniqueProductIdentifier {
    return new UniqueProductIdentifier(
      data.externalUUID ?? randomUUID(),
      data.referenceId,
      data.type ?? UniqueProductIdentifierType.OPEN_DPP_UUID,
      undefined,
      data.organizationId ?? null,
    );
  }

  /**
   * Create a GS1 UPI from a manufacturer-supplied GTIN plus an optional batch and
   * serial. The GTIN is mod-10 validated and normalized to GTIN-14; batch/serial
   * are trimmed and validated against CSET-82 (≤ 20 chars). A blank batch/serial
   * is treated as absent.
   *
   * @throws ValueError when the GTIN, batch, or serial is invalid.
   */
  static createGs1(data: {
    externalUUID?: string;
    referenceId: string;
    gtin: string;
    batch?: string | null;
    serial?: string | null;
    organizationId?: string | null;
  }): UniqueProductIdentifier {
    return new UniqueProductIdentifier(
      data.externalUUID ?? randomUUID(),
      data.referenceId,
      UniqueProductIdentifierType.GS1,
      normalizeGs1Identity(data),
      data.organizationId ?? null,
    );
  }

  static loadFromDb(data: {
    uuid: string;
    referenceId: string;
    type?: UniqueProductIdentifierTypeValue | null;
    gtin?: string | null;
    batch?: string | null;
    serial?: string | null;
    organizationId?: string | null;
  }) {
    const type = data.type ?? UniqueProductIdentifierType.OPEN_DPP_UUID;
    const gs1 =
      data.gtin !== null && data.gtin !== undefined
        ? assembleGs1Identity(data.gtin, data.batch, data.serial)
        : undefined;
    return new UniqueProductIdentifier(
      data.uuid,
      data.referenceId,
      type,
      gs1,
      data.organizationId ?? null,
    );
  }

  /**
   * Return a NEW UPI with the organizationId set.
   * Used by the backfill runner to denormalize the owning passport's org.
   */
  withOrganizationId(organizationId: string): UniqueProductIdentifier {
    return new UniqueProductIdentifier(
      this.uuid,
      this.referenceId,
      this.type,
      this.gs1,
      organizationId,
    );
  }

  /**
   * Return a NEW UPI with its GS1 identity replaced from raw input (GTIN plus an
   * optional batch / serial). Omitting batch / serial clears them. Never mutates
   * the receiver.
   *
   * @throws ValueError when the GTIN, batch, or serial is invalid.
   */
  withGs1(input: Gs1IdentityInput): UniqueProductIdentifier {
    return new UniqueProductIdentifier(
      this.uuid,
      this.referenceId,
      UniqueProductIdentifierType.GS1,
      normalizeGs1Identity(input),
      this.organizationId,
    );
  }

  /**
   * The granularity implied by the GS1 identity's key structure:
   * - `'item'` when a serial number (AI 21) is present (serial dominates)
   * - `'batch'` when a batch/lot (AI 10) is present but no serial
   * - `'model'` when only a GTIN (AI 01) is present
   * - `null` for non-GS1 UPIs (no GS1 identity)
   */
  get granularity(): "model" | "batch" | "item" | null {
    if (!this.gs1) {
      return null;
    }
    if (this.gs1.serial !== undefined) {
      return "item";
    }
    if (this.gs1.batch !== undefined) {
      return "batch";
    }
    return "model";
  }

  /**
   * Build the uncompressed GS1 Digital Link this UPI's identity encodes, listing
   * present AIs in canonical order `01 -> 10 -> 21`.
   *
   * @throws ValueError when this UPI has no GS1 identity.
   */
  buildDigitalLink(resolverBase: string): string {
    if (!this.gs1) {
      throw new ValueError(
        "Cannot build a GS1 Digital Link for a unique product identifier without a GS1 identity",
      );
    }
    // The resolver is root-mounted at /01, so the link renders on the origin even
    // when the shared permalink base carries a path (e.g. the default `/p`).
    return buildGs1DigitalLink(baseUrlOrigin(resolverBase), {
      gtin: this.gs1.gtin,
      batch: this.gs1.batch,
      serial: this.gs1.serial,
    });
  }

  /**
   * Assemble the GS1 identity response (uuid, referenceId, gtin, batch, serial, and
   * the server-built Digital Link) for this UPI. The domain owns the "a GS1 UPI
   * carries a GS1 identity" invariant, so callers no longer non-null-assert `gs1`.
   *
   * @throws ValueError when this UPI has no GS1 identity.
   */
  toGs1Response(resolverBase: string): Gs1IdentityResponse {
    if (!this.gs1) {
      throw new ValueError(
        "Cannot build a GS1 identity response for a unique product identifier without a GS1 identity",
      );
    }
    return {
      uuid: this.uuid,
      referenceId: this.referenceId,
      gtin: this.gs1.gtin,
      batch: this.gs1.batch ?? null,
      serial: this.gs1.serial ?? null,
      digitalLink: this.buildDigitalLink(resolverBase),
    };
  }

  /**
   * Build a read-only list-item snapshot suitable for the org-scoped UPI list.
   *
   * Fields are selected explicitly (not spread from `toPlain()`) so that future
   * additions to `toPlain()` (e.g. `organizationId` in Slice 24) never leak into
   * the list-item shape or break the `UniqueProductIdentifierListItemDtoSchema` parse.
   *
   * `digitalLink` is assembled only when this UPI has a GS1 identity AND a
   * `resolverBase` is provided; otherwise it is `null`.
   *
   * `permalink` is the gs1-link permalink summary resolved by the caller
   * (list endpoints only); it defaults to `null` everywhere else.
   */
  toListItem({
    resolverBase,
    passportPublished,
    permalink = null,
  }: {
    resolverBase?: string;
    passportPublished: boolean;
    permalink?: { id: string; publicUrl: string } | null;
  }) {
    const digitalLink = this.gs1 && resolverBase ? this.buildDigitalLink(resolverBase) : null;

    return {
      uuid: this.uuid,
      referenceId: this.referenceId,
      type: this.type,
      gtin: this.gs1?.gtin ?? null,
      batch: this.gs1?.batch ?? null,
      serial: this.gs1?.serial ?? null,
      granularity: this.granularity,
      digitalLink,
      passportPublished,
      permalink,
    };
  }

  toPlain() {
    return {
      uuid: this.uuid,
      referenceId: this.referenceId,
      type: this.type,
      gtin: this.gs1?.gtin ?? null,
      batch: this.gs1?.batch ?? null,
      serial: this.gs1?.serial ?? null,
      organizationId: this.organizationId,
    };
  }
}
