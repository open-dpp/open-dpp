/// <reference lib="dom" />
import { z } from "zod";

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
