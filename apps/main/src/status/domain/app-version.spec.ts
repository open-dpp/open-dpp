import { UNKNOWN_APP_VERSION, isValidAppVersion, resolveAppVersion } from "./app-version";

describe("isValidAppVersion", () => {
  it.each(["1.2.3", "0.1.0", "3.1.3-rc.1", "3.1.3+sha.abc1234", " 3.1.3 "])(
    "accepts the semantic version %p",
    (candidate) => {
      expect(isValidAppVersion(candidate)).toBe(true);
    },
  );

  // The values Docker tags resolve to — these are what leaked into the UI.
  it.each(["main", "latest", "sha-abc1234", "unknown", "v1.2.3-not-semver!", "", "  "])(
    "rejects the non-version %p",
    (candidate) => {
      expect(isValidAppVersion(candidate)).toBe(false);
    },
  );

  // `semver.valid()` accepts these, but the UI adds its own "v" prefix.
  it.each(["v1.2.3", "v3.1.3+sha.abc1234", " v0.1.0 "])(
    "rejects the v-prefixed version %p",
    (candidate) => {
      expect(isValidAppVersion(candidate)).toBe(false);
    },
  );

  it("rejects undefined and null", () => {
    expect(isValidAppVersion(undefined)).toBe(false);
    expect(isValidAppVersion(null)).toBe(false);
  });
});

describe("resolveAppVersion", () => {
  it("returns the first candidate that is a semantic version", () => {
    expect(resolveAppVersion([undefined, "main", "3.1.3", "9.9.9"])).toBe("3.1.3");
  });

  it("keeps build metadata intact", () => {
    expect(resolveAppVersion(["3.1.3+sha.abc1234"])).toBe("3.1.3+sha.abc1234");
  });

  it("trims the resolved version", () => {
    expect(resolveAppVersion([" 3.1.3 "])).toBe("3.1.3");
  });

  it("skips a v-prefixed candidate", () => {
    expect(resolveAppVersion(["v1.2.3", "3.1.3"])).toBe("3.1.3");
  });

  it("returns unknown when no candidate is a semantic version", () => {
    expect(resolveAppVersion([undefined, null, "", "main"])).toBe(UNKNOWN_APP_VERSION);
  });

  it("returns unknown when there are no candidates", () => {
    expect(resolveAppVersion([])).toBe(UNKNOWN_APP_VERSION);
  });
});
