/// <reference lib="dom" />
import { z } from "zod";

export function canonicaliseBaseUrl(s: string): string {
  try {
    const u = new URL(s);
    u.hostname = u.hostname.toLowerCase();
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.protocol}//${u.host}${path}`;
  } catch {
    return s;
  }
}

/**
 * The origin (`scheme://host[:port]`) of a base URL, dropping any path, query, or
 * fragment. The GS1 Digital Link resolver is mounted at the domain root
 * (`/01/{gtin}`), so a GS1 link renders on the origin even when the shared
 * permalink base carries a path (e.g. the presentation viewer's `/p`). Returns the
 * input unchanged when it cannot be parsed as a URL.
 */
export function baseUrlOrigin(s: string): string {
  try {
    return new URL(s).origin;
  } catch {
    return s;
  }
}

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
        return !u.search && !u.hash;
      } catch {
        return false;
      }
    },
    { message: "must not include query or fragment" },
  )
  .refine(
    (s) => {
      try {
        return !new URL(s).pathname.includes("//");
      } catch {
        return false;
      }
    },
    { message: "path must not contain empty segments ('//')" },
  )
  .overwrite(canonicaliseBaseUrl);

export type PermalinkBaseUrl = z.infer<typeof PermalinkBaseUrlSchema>;
