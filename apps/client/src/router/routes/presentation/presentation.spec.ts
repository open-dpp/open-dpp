import { describe, expect, it } from "vitest";
import { PERMALINK_RESERVED_SLUGS, PermalinkSlugSchema } from "@open-dpp/dto";
import { PRESENTATION_PARENT } from "./presentation";

// Drift guard: any literal path segment registered as a child of `/p`
// (PRESENTATION_PARENT) must be reserved on the backend so an end user
// cannot pick a slug that collides with one of the app's own routes.
//
// Numeric-only literals (e.g. "404") don't need an explicit reservation —
// the slug schema already rejects numeric-only strings via a separate refine.
//
// Adding a new literal child here without updating PERMALINK_RESERVED_SLUGS
// in packages/dto/src/permalinks/permalink.dto.ts will fail this test.
describe("PRESENTATION_PARENT route literals are reserved", () => {
  function literalChildSegments(): string[] {
    const segments: string[] = [];
    for (const child of PRESENTATION_PARENT.children ?? []) {
      const path = child.path;
      // Skip params (`:permalink`, `:permalink/chat`) and wildcards.
      if (!path || path.startsWith(":") || path.includes(":") || path.includes("(")) {
        continue;
      }
      // Take only the first path segment — a child like "foo/bar" still
      // means /p/foo is reserved.
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
    expect(literals.length).toBeGreaterThan(0); // sanity check

    for (const literal of literals) {
      if (isNumericOnly(literal)) {
        // Numeric-only is rejected by PermalinkSlugSchema already; explicit
        // reservation is unnecessary.
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
