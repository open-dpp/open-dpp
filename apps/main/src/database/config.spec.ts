import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "./config";

// Mock EnvService
const mockConfigService = {
  get: jest.fn(),
} as unknown as EnvService;

describe("generateMongoConfig", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  it("should replace existing database name in test environment", () => {
    process.env.NODE_ENV = "test";
    (mockConfigService.get as jest.Mock).mockReturnValue("mongodb://localhost:27017/existing-db");

    const config = generateMongoConfig(mockConfigService);

    expect(config.dbName).not.toContain("existing-db");
    expect(config.dbName).toMatch(/^test-[a-f0-9-]+/)
  });
});
