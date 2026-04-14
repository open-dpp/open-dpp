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

  it("falls back to npm_package_version when APP_VERSION is not set", () => {
    delete process.env.APP_VERSION;
    process.env.npm_package_version = "7.7.7-npm-version";

    const status = service.getStatus();

    expect(status.version).toBe("7.7.7-npm-version");
  });

  it("returns 'unknown' when neither env var is set", () => {
    delete process.env.APP_VERSION;
    delete process.env.npm_package_version;

    const status = service.getStatus();

    expect(status.version).toBe("unknown");
  });
});
