import { LatestApiVersionWithPrefixDto } from "@open-dpp/dto";

/** The better-auth mount: the latest API version, hand-routed by the AuthController. */
export const AUTH_BASE_PATH = `/api/${LatestApiVersionWithPrefixDto}/auth`;
