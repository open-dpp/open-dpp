import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("const - DEFAULT_LANGUAGE production configuration", () => {
  beforeEach(() => {
    // Reset modules before each
    vi.resetModules();
    // Clear any cached modules
    vi.clearAllMocks();
    // Spy on console.error to suppress output during tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Runtime configuration (fetchConfig from /config.json)", () => {
    it("should fetch DEFAULT_LANGUAGE from config.json", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "de-DE",
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      expect(global.fetch).toHaveBeenCalledWith("/config.json");
      expect(DEFAULT_LANGUAGE).toBe("de-DE");
    });

    it("should use config.json DEFAULT_LANGUAGE when available", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "de-DE",
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");
      expect(DEFAULT_LANGUAGE).toBe("de-DE");
    });

    it("should fallback to en-US if config.json missing DEFAULT_LANGUAGE", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        // DEFAULT_LANGUAGE is missing
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should fallback to en-US if config.json is empty object", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({}),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should handle empty string value from config.json", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "", // Empty string is falsy
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      // Empty string should trigger fallback
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should handle null value from config.json", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: null,
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should handle undefined value from config.json", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: undefined,
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });
  });

  describe("Error handling and resilience", () => {
    it("should fallback to en-US if fetch fails", async () => {
      global.fetch = vi.fn().mockRejectedValue(
        new Error("Network error fetching config.json")
      );

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      // Should still have a valid default
      expect(DEFAULT_LANGUAGE).toBeDefined();
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should fallback to en-US if JSON parsing fails", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.reject(new SyntaxError("Invalid JSON")),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should handle fetch returning 404", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      // Even if server returns 404, should fallback gracefully
      expect(DEFAULT_LANGUAGE).toBeDefined();
      expect(typeof DEFAULT_LANGUAGE).toBe("string");
    });

    it("should handle timeout/abort errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(
        new DOMException("The request was aborted", "AbortError")
      );

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should log error to console when fetch fails", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      global.fetch = vi.fn().mockRejectedValue(
        new Error("Network error")
      );

      await import("./const.ts");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to fetch runtime configuration:",
        expect.any(Error)
      );
    });
  });

  describe("Locale validation", () => {
    it("should always export a valid locale", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network fail"));

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      expect(DEFAULT_LANGUAGE).toBeDefined();
      expect(typeof DEFAULT_LANGUAGE).toBe("string");
      expect(DEFAULT_LANGUAGE.length).toBeGreaterThan(0);
    });

    it("should export supported locale from config.json", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "de-DE",
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      expect(["en-US", "de-DE"]).toContain(DEFAULT_LANGUAGE);
    });

    it("should be one of the supported locales (en-US or de-DE)", async () => {
      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      expect(["en-US", "de-DE"]).toContain(DEFAULT_LANGUAGE);
    });
  });

  describe("Three-layer fallback chain", () => {
    it("Layer 1: config.json overrides hardcoded default", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "de-DE",
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      // Deployment layer (config.json) > Application default
      expect(DEFAULT_LANGUAGE).toBe("de-DE");
    });

    it("Layer 2: Hardcoded default when config.json missing", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Not found"));

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      // Falls back to "en-US" when config.json unavailable
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should handle partial config.json gracefully", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        // DEFAULT_LANGUAGE missing - should use fallback
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });
  });

  describe("Edge cases and malformed data", () => {
    it("should ignore unexpected properties in config.json", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "de-DE",
        unexpectedProp: "should-be-ignored",
        anotherProp: 123,
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      expect(DEFAULT_LANGUAGE).toBe("de-DE");
    });

    it("should handle whitespace-only DEFAULT_LANGUAGE", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "   ", // Whitespace only
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      // Whitespace is truthy in JS, so it will be used
      // This might be a bug - ideally should validate non-empty AND known locale
      expect(DEFAULT_LANGUAGE).toBeDefined();
    });

    it("should handle very large config.json", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "de-DE",
        // Simulate large payload
        ...Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [
            `prop${i}`,
            `value${i}`,
          ])
        ),
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      expect(DEFAULT_LANGUAGE).toBe("de-DE");
    });

    it("should handle special characters in DEFAULT_LANGUAGE", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "en-US@special", // Special characters
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      // Will be set as-is (no validation that it's a real locale)
      expect(DEFAULT_LANGUAGE).toBe("en-US@special");
    });
  });

  describe("Integration scenarios", () => {
    it("Production scenario: config.json with de-DE for German deployment", async () => {
      const mockConfigJson = {
        API_URL: "https://api.example.de/api",
        DEFAULT_LANGUAGE: "de-DE",
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      expect(DEFAULT_LANGUAGE).toBe("de-DE");
    });

    it("Production scenario: config.json with en-US for US deployment", async () => {
      const mockConfigJson = {
        API_URL: "https://api.example.com/api",
        DEFAULT_LANGUAGE: "en-US",
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("Development scenario: missing config.json falls back to en-US", async () => {
      global.fetch = vi.fn().mockRejectedValue(
        new Error("404 Not Found during development")
      );

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      // Dev machine doesn't have config.json, uses hardcoded default
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("Staging scenario: corrupted config.json handled gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.reject(new SyntaxError("Malformed JSON")),
      });

      const { DEFAULT_LANGUAGE } = await import("./const.ts");

      // Even with corruption, app doesn't crash
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });
  });

  describe("Basic module exports", () => {
    it("should export DEFAULT_LANGUAGE", async () => {
      const { DEFAULT_LANGUAGE } = await import("./const.ts");
      expect(DEFAULT_LANGUAGE).toBeDefined();
    });

    it("should have DEFAULT_LANGUAGE with valid locale", async () => {
      const { DEFAULT_LANGUAGE } = await import("./const.ts");
      expect(["en-US", "de-DE"]).toContain(DEFAULT_LANGUAGE);
    });

    it("should export LAST_SELECTED_LANGUAGE constant", async () => {
      const { LAST_SELECTED_LANGUAGE } = await import("./const.ts");
      expect(LAST_SELECTED_LANGUAGE).toBe("open-dpp-local-last-language");
    });
  });
});