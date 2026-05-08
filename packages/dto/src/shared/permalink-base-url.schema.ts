/// <reference lib="dom" />
import { z } from "zod";

// White-label base URL for public permalinks. Stored as an origin
// (scheme + host + optional port). Path / query / fragment are rejected so
// URL composition is `${baseUrl}/p/${slug}` regardless of where the value
// came from. The transform canonicalises (lowercase host, no trailing slash)
// so two semantically identical values always compare equal in the DB.
//
// The triple-slash `lib="dom"` reference above pulls in the URL class
// definition for type-checking. The dto package's `@tsconfig/node-lts`
// preset omits DOM types; we don't actually depend on the DOM at runtime
// (URL is a JS global in both Node 10+ and every browser we target), but
// TypeScript needs the lib reference to type-check `new URL(...)`.
export const PermalinkBaseUrlSchema = z
  .string()
  .min(8)
  .max(2048)
  .url()
  .refine(
    (s) => {
      try {
        return ["http:", "https:"].includes(new URL(s).protocol);
      } catch {
        return false;
      }
    },
    { message: "must use http or https" },
  )
  .refine(
    (s) => {
      try {
        const u = new URL(s);
        return (u.pathname === "/" || u.pathname === "") && !u.search && !u.hash;
      } catch {
        return false;
      }
    },
    { message: "must not include path, query, or fragment" },
  )
  // `.overwrite()` (Zod v4) — type-preserving canonicalisation. We use it
  // instead of `.transform()` because zod-openapi rejects transforms in
  // output schemas (the response shape for `GET /branding` and the
  // permalink list/bundle endpoints both surface this field). Since the
  // input and output type are both `string`, no expressiveness is lost.
  //
  // `.overwrite()` runs even when an earlier check failed, so we guard
  // against `new URL(...)` throwing on bad input — the prior `.url()` /
  // refine checks will already surface the validation error; the
  // canonicalised value is just unused in that case.
  .overwrite((s) => {
    try {
      const u = new URL(s);
      u.hostname = u.hostname.toLowerCase();
      return u.origin;
    } catch {
      return s;
    }
  });

export type PermalinkBaseUrl = z.infer<typeof PermalinkBaseUrlSchema>;
