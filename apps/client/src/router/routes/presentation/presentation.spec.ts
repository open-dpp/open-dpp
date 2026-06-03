import { describe, expect, it } from "vitest";
import { PERMALINK_RESERVED_SLUGS, PermalinkSlugSchema } from "@open-dpp/dto";
import { PRESENTATION_PARENT } from "./presentation";

describe("PRESENTATION_PARENT route literals are reserved", () => {
  function literalChildSegments(): string[] {
    const segments: string[] = [];
    for (const child of PRESENTATION_PARENT.children ?? []) {
      const path = child.path;
      if (!path || path.startsWith(":") || path.includes(":") || path.includes("(")) {
        continue;
      }
      const head = path.split("/")[0];
      if (head !== undefined && head.length > 0) {
        segments.push(head);
      }
    }
    return segments;
  }

  function isNumericOnly(s: string): boolean {
    return /^\d+$/.test(s);
  }

  it("every literal child segment is either numeric-only (already rejected) or in PERMALINK_RESERVED_SLUGS", () => {
    const literals = literalChildSegments();
    expect(literals.length).toBeGreaterThan(0);

    for (const literal of literals) {
      if (isNumericOnly(literal)) {
        expect(PermalinkSlugSchema.safeParse(literal).success).toBe(false);
        continue;
      }
      expect(PERMALINK_RESERVED_SLUGS).toContain(literal);
    }
  });

  it("each entry of PERMALINK_RESERVED_SLUGS is itself rejected by the slug schema", () => {
    for (const reserved of PERMALINK_RESERVED_SLUGS) {
      const result = PermalinkSlugSchema.safeParse(reserved);
      expect(result.success).toBe(false);
    }
  });
});
