import { z } from "zod";

/** Upper bound for the signed authorize query the OAuth Provider appended to /signup. */
const MAX_OAUTH_QUERY_LENGTH = 8192;

/**
 * Resumes a pending OAuth Provider authorization after the User signed up (the Trusted
 * Client asked for `prompt=create`). `oauthQuery` is the signed query, up to and including
 * `sig`, that the provider put on the sign-up page's URL.
 */
export const ContinueAuthorizationDtoSchema = z.object({
  oauthQuery: z.string().min(1).max(MAX_OAUTH_QUERY_LENGTH),
});

export type ContinueAuthorizationDto = z.infer<typeof ContinueAuthorizationDtoSchema>;

/** Where the browser continues: the Trusted Client's redirect URI with the authorization code. */
export const ContinueAuthorizationResponseDtoSchema = z.object({
  url: z.string().min(1),
});

export type ContinueAuthorizationResponseDto = z.infer<
  typeof ContinueAuthorizationResponseDtoSchema
>;
