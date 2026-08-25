import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { StatusService } from "./status.service";

describe("StatusService", () => {
  let service: StatusService;
  const originalAppVersion = process.env.APP_VERSION;
  const originalNpmPackageVersion = process.env.npm_package_version;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatusService],
    }).compile();
    service = module.get<StatusService>(StatusService);
  });

  afterEach(() => {
    if (originalAppVersion === undefined) {
      delete process.env.APP_VERSION;
    } else {
      process.env.APP_VERSION = originalAppVersion;
    }
    if (originalNpmPackageVersion === undefined) {
      delete process.env.npm_package_version;
    } else {
      process.env.npm_package_version = originalNpmPackageVersion;
    }
  });

  it("returns version from APP_VERSION env var when set", () => {
    process.env.APP_VERSION = "9.9.9-app-version";
    process.env.npm_package_version = "1.2.3-should-be-ignored";

    const status = service.getStatus();

    expect(status.version).toBe("9.9.9-app-version");
  });

  it("keeps build metadata in APP_VERSION", () => {
    process.env.APP_VERSION = "3.1.3+sha.abc1234";

    const status = service.getStatus();

    expect(status.version).toBe("3.1.3+sha.abc1234");
  });

  it("falls back to npm_package_version when APP_VERSION is not set", () => {
    delete process.env.APP_VERSION;
    process.env.npm_package_version = "7.7.7-npm-version";

    const status = service.getStatus();

    expect(status.version).toBe("7.7.7-npm-version");
  });

  // Regression: CI passed the primary Docker tag as APP_VERSION, so images
  // built from main reported "main" as the application version.
  it.each(["main", "latest", "sha-abc1234", "unknown"])(
    "ignores the non-semver APP_VERSION %p",
    (appVersion) => {
      process.env.APP_VERSION = appVersion;
      process.env.npm_package_version = "7.7.7-npm-version";

      const status = service.getStatus();

      expect(status.version).toBe("7.7.7-npm-version");
    },
  );

  it("ignores an empty APP_VERSION", () => {
    process.env.APP_VERSION = "";
    process.env.npm_package_version = "7.7.7-npm-version";

    const status = service.getStatus();

    expect(status.version).toBe("7.7.7-npm-version");
  });

  it("falls back to the bundled package version when no env var is set", () => {
    delete process.env.APP_VERSION;
    delete process.env.npm_package_version;

    const status = service.getStatus();

    // Asserting the shape, not the value, so releases do not break this test.
    expect(status.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
