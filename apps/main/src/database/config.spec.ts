import { type Mock, afterEach, describe, expect, it, vi } from "vitest";
import { EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "./config";

// Mock EnvService
const mockConfigService = {
  get: vi.fn(),
} as unknown as EnvService;

describe("generateMongoConfig", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.clearAllMocks();
  });

  it("should replace existing database name in test environment", () => {
    process.env.NODE_ENV = "test";
    (mockConfigService.get as Mock).mockReturnValue("mongodb://localhost:27017/existing-db");

    const config = generateMongoConfig(mockConfigService);

    expect(config.dbName).not.toContain("existing-db");
    expect(config.dbName).toMatch(/^test-[a-f0-9-]+/);
  });
});
