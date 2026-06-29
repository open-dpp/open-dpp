import { envSchema } from "@open-dpp/env";
import process from "node:process";
import { v4 as uuid4 } from "uuid";
import { z } from "zod";

export const EnvConfig = envSchema.parse(process.env);

// Shared, pre-provisioned user used by auth.setup.ts (CI). OPTIONAL: in local dev
// these are usually unset, and the `account` project specs use disposable users
// instead (see tests/helpers/disposable-user.ts), so importing this file must not throw.
export const User = z
  .object({
    E2E_USERNAME: z.string().optional(),
    E2E_PASSWORD: z.string().optional(),
  })
  .parse(process.env);

export const ExampleOrganisation = `ExampleOrg-${uuid4()}`;

// API version prefix. Mirrors LatestApiVersionWithPrefixDto in @open-dpp/dto;
// hardcoded to avoid adding a workspace dep (+install) to the e2e package.
export const API_VERSION = "v2";
export const ApiBase = `${EnvConfig.OPEN_DPP_URL}/api/${API_VERSION}`;
export const AuthBase = `${ApiBase}/auth`;

// Mailpit HTTP API (docker-compose.dev.yml maps :8025). Tests READ mail here;
// the backend SENDS via SMTP :8026 -> container :1025.
export const MailpitConfig = z
  .object({ baseUrl: z.string().url() })
  .parse({ baseUrl: process.env.MAILPIT_URL ?? "http://localhost:8025" });
