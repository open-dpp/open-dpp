import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findPackageVersion, readBundledPackageVersion } from "./package-json-version";

describe("readBundledPackageVersion", () => {
  it("reads the version of the package this code is bundled with", () => {
    // Asserting the shape, not the value, so releases do not break this test.
    expect(readBundledPackageVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe("findPackageVersion", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "package-json-version-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("walks up to the nearest package.json", () => {
    writeFileSync(join(root, "package.json"), JSON.stringify({ version: "4.5.6" }));
    const nested = join(root, "dist", "status", "infrastructure");
    mkdirSync(nested, { recursive: true });

    expect(findPackageVersion(nested)).toBe("4.5.6");
  });

  it("skips a package.json without a version", () => {
    writeFileSync(join(root, "package.json"), JSON.stringify({ version: "4.5.6" }));
    const nested = join(root, "nested");
    mkdirSync(nested);
    writeFileSync(join(nested, "package.json"), JSON.stringify({ name: "no-version" }));

    expect(findPackageVersion(nested)).toBe("4.5.6");
  });

  it("skips a malformed package.json", () => {
    writeFileSync(join(root, "package.json"), JSON.stringify({ version: "4.5.6" }));
    const nested = join(root, "nested");
    mkdirSync(nested);
    writeFileSync(join(nested, "package.json"), "{ not json");

    expect(findPackageVersion(nested)).toBe("4.5.6");
  });
});
