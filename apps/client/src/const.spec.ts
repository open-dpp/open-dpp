import { beforeEach, describe, expect, it, vi } from "vitest";

// Setup mocks BEFORE any imports using vi.hoisted
const mocks = vi.hoisted(() => {
  return {
    fetch: vi.fn(),
  };
});

// Mock fetch globally BEFORE test suite runs
globalThis.fetch = mocks.fetch;

describe("const - DEFAULT_LANGUAGE production configuration", () => {
  beforeEach(() => {
    // Reset all mocks between tests
    vi.clearAllMocks();
    // Clear module cache so const.ts re-evaluates with fresh state
    vi.resetModules();
    // Re-establish mock connection after reset
    globalThis.fetch = mocks.fetch;
  });

  describe("runtime configuration (fetchConfig from /config.json)", () => {
    it("should fetch DEFAULT_LANGUAGE from config.json", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "de-DE",
      };

      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigJson),
      });

      const { fetchConfig } = await import("./const.ts");

      // Call fetchConfig explicitly (not called on import due to VITEST env check)
      await fetchConfig();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mocks.fetch).toHaveBeenCalledWith("/config.json");
    });

    it("should use config.json DEFAULT_LANGUAGE when available", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "de-DE",
      };

      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigJson),
      });

      const { fetchConfig } = await import("./const.ts");
      await fetchConfig();

      // Re-import to get updated values
      const { DEFAULT_LANGUAGE } = await import("./const.ts");
      expect(DEFAULT_LANGUAGE).toBe("de-DE");
    });

    it("should fallback to en-US if config.json missing DEFAULT_LANGUAGE", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        // DEFAULT_LANGUAGE is missing
      };

      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigJson),
      });

      const constModule = await import("./const.ts");
      await constModule.fetchConfig();
      expect(constModule.DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should fallback to en-US if config.json is empty object", async () => {
      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { DEFAULT_LANGUAGE, fetchConfig } = await import("./const.ts");
      await fetchConfig();
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should handle empty string value from config.json", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "", // Empty string is falsy
      };

      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE, fetchConfig } = await import("./const.ts");
      await fetchConfig();

      // Empty string should trigger fallback
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should handle null value from config.json", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: null,
      };

      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE, fetchConfig } = await import("./const.ts");
      await fetchConfig();
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should handle undefined value from config.json", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: undefined,
      };

      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigJson),
      });

      const { DEFAULT_LANGUAGE, fetchConfig } = await import("./const.ts");
      await fetchConfig();
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });
  });

  describe("error handling and resilience", () => {
    it("should fallback to en-US if fetch fails", async () => {
      mocks.fetch.mockRejectedValueOnce(
        new Error("Network error fetching config.json"),
      );

      const { DEFAULT_LANGUAGE, fetchConfig } = await import("./const.ts");
      await fetchConfig();

      // Should still have a valid default
      expect(DEFAULT_LANGUAGE).toBeDefined();
      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should fallback to en-US if JSON parsing fails", async () => {
      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new SyntaxError("Invalid JSON")),
      });

      const { DEFAULT_LANGUAGE, fetchConfig } = await import("./const.ts");
      await fetchConfig();

      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should handle fetch returning 404", async () => {
      mocks.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      });

      const { DEFAULT_LANGUAGE, fetchConfig } = await import("./const.ts");
      await fetchConfig();

      // Even if server returns 404, should fallback gracefully
      expect(DEFAULT_LANGUAGE).toBeDefined();
      expect(typeof DEFAULT_LANGUAGE).toBe("string");
    });

    it("should handle timeout/abort errors", async () => {
      mocks.fetch.mockRejectedValueOnce(
        new DOMException("The request was aborted", "AbortError"),
      );

      const { DEFAULT_LANGUAGE, fetchConfig } = await import("./const.ts");
      await fetchConfig();

      expect(DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should log error to console when fetch fails", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mocks.fetch.mockRejectedValueOnce(
        new Error("Network error"),
      );

      const { fetchConfig } = await import("./const.ts");
      await fetchConfig();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to fetch runtime configuration:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("edge cases and malformed data", () => {
    it("should ignore unexpected properties in config.json", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "de-DE",
        unexpectedProp: "should-be-ignored",
        anotherProp: 123,
      };

      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigJson),
      });

      const constModule = await import("./const.ts");
      await constModule.fetchConfig();

      expect(constModule.DEFAULT_LANGUAGE).toBe("de-DE");
    });

    it("should handle whitespace-only DEFAULT_LANGUAGE", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "   ", // Whitespace only
      };

      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigJson),
      });

      const constModule = await import("./const.ts");
      await constModule.fetchConfig();

      // After trim(), whitespace-only should fall back to en-US
      expect(constModule.DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("should handle very large config.json", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "de-DE",
        ...Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [
            `prop${i}`,
            `value${i}`,
          ]),
        ),
      };

      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigJson),
      });

      const constModule = await import("./const.ts");
      await constModule.fetchConfig();

      expect(constModule.DEFAULT_LANGUAGE).toBe("de-DE");
    });

    it("should handle special characters in DEFAULT_LANGUAGE", async () => {
      const mockConfigJson = {
        API_URL: "http://localhost:3000/api",
        DEFAULT_LANGUAGE: "en-US@special",
      };

      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigJson),
      });

      const constModule = await import("./const.ts");
      await constModule.fetchConfig();

      expect(constModule.DEFAULT_LANGUAGE).toBe("en-US@special");
    });
  });

  describe("integration scenarios", () => {
    it("production scenario: config.json with de-DE for German deployment", async () => {
      const mockConfigJson = {
        API_URL: "https://api.example.de/api",
        DEFAULT_LANGUAGE: "de-DE",
      };

      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigJson),
      });

      const constModule = await import("./const.ts");
      await constModule.fetchConfig();

      expect(constModule.DEFAULT_LANGUAGE).toBe("de-DE");
    });

    it("production scenario: config.json with en-US for US deployment", async () => {
      const mockConfigJson = {
        API_URL: "https://api.example.com/api",
        DEFAULT_LANGUAGE: "en-US",
      };

      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigJson),
      });

      const constModule = await import("./const.ts");
      await constModule.fetchConfig();

      expect(constModule.DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("development scenario: missing config.json falls back to en-US", async () => {
      mocks.fetch.mockRejectedValueOnce(
        new Error("404 Not Found during development"),
      );

      const constModule = await import("./const.ts");
      await constModule.fetchConfig();

      expect(constModule.DEFAULT_LANGUAGE).toBe("en-US");
    });

    it("staging scenario: corrupted config.json handled gracefully", async () => {
      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new SyntaxError("Malformed JSON")),
      });

      const constModule = await import("./const.ts");
      await constModule.fetchConfig();

      expect(constModule.DEFAULT_LANGUAGE).toBe("en-US");
    });
  });

  describe("basic module exports", () => {
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

    it("should export fetchConfig function", async () => {
      const { fetchConfig } = await import("./const.ts");
      expect(typeof fetchConfig).toBe("function");
    });
  });
});
