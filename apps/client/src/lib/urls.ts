import { z } from "zod";

export function isSafeHref(href: any): boolean {
  try {
    const parsed = new URL(z.string().parse(href));
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
