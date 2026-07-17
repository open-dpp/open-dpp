import { ValueError } from "./domain.errors";
import { parseOrThrow } from "./parse-or-throw";

// Structural fakes satisfying SafeParseable — keeps this test (and the package)
// free of a zod dependency. Real-ZodError integration (incl. `cause instanceof
// ZodError`) is covered by the permalink / presentation-configuration domain specs.
const ok = <T>(data: T) => ({ safeParse: () => ({ success: true as const, data }) });
const fail = (issues: { path: PropertyKey[]; message: string }[], error: unknown = { issues }) => ({
  safeParse: () => ({ success: false as const, error }),
});

describe("parseOrThrow", () => {
  it("returns the parsed value unchanged on success", () => {
    expect(parseOrThrow(ok({ n: 42 }), { n: "ignored" }, "Thing")).toEqual({ n: 42 });
  });

  it("throws a ValueError formatted as 'Invalid <label>: <path>: <message>'", () => {
    try {
      parseOrThrow(fail([{ path: ["n"], message: "expected number" }]), {}, "Thing");
      throw new Error("expected parseOrThrow to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ValueError);
      expect((error as Error).message).toBe("Invalid Thing: n: expected number");
    }
  });

  it("attaches the original error as cause", () => {
    const original = { issues: [{ path: ["n"], message: "bad" }] };
    try {
      parseOrThrow(fail(original.issues, original), {}, "Thing");
      throw new Error("expected parseOrThrow to throw");
    } catch (error) {
      expect((error as Error).cause).toBe(original);
    }
  });

  it("joins multiple issues with '; '", () => {
    try {
      parseOrThrow(
        fail([
          { path: ["a"], message: "bad a" },
          { path: ["b", 0], message: "bad b" },
        ]),
        {},
        "Thing",
      );
      throw new Error("expected parseOrThrow to throw");
    } catch (error) {
      expect((error as Error).message).toBe("Invalid Thing: a: bad a; b.0: bad b");
    }
  });

  it("renders an empty (root) path as a leading ': ' — matches the pre-refactor sites", () => {
    try {
      parseOrThrow(fail([{ path: [], message: "Invalid UUID" }]), "x", "Permalink");
      throw new Error("expected parseOrThrow to throw");
    } catch (error) {
      expect((error as Error).message).toBe("Invalid Permalink: : Invalid UUID");
    }
  });
});
