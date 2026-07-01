import type { MediaInfo } from "../components/media/MediaInfo.interface";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMediaStore } from "./media";

// Mocks
const postMock = vi.fn();
const getMock = vi.fn();

vi.mock("axios", () => {
  return {
    default: {
      create: () => ({
        post: (...args: never[]) => postMock(...args),
        get: (...args: never[]) => getMock(...args),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
        defaults: {
          headers: {
            common: {},
          },
        },
      }),
    },
  };
});

vi.mock("../const", () => ({
  MEDIA_SERVICE_URL: "http://media-service",
  API_URL: "http://api",
  MARKETPLACE_URL: "http://marketplace",
  AGENT_SERVER_URL: "http://agent-server",
  ANALYTICS_URL: "http://analytics",
}));

describe("media store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    postMock.mockReset();
    getMock.mockReset();
  });

  // ADR 0006 (Design C): public file media gated through the permalink, keyed by mediaId.
  describe("fetchPermalinkMedia", () => {
    it("combines info and blob from the permalink-gated by-id routes", async () => {
      const store = useMediaStore();
      const blob = new Blob(["data"], { type: "application/octet-stream" });

      getMock.mockImplementation((url: string) => {
        if (url.includes("/info")) {
          return Promise.resolve({
            data: { id: "m-1", title: "", size: 5, mimeType: "image/jpeg" } satisfies MediaInfo,
          });
        }
        if (url.includes("/download")) {
          return Promise.resolve({ data: blob });
        }
        return Promise.reject(new Error(`Unexpected URL ${url}`));
      });

      const result = await store.fetchPermalinkMedia("slug-1", "m-1");
      expect(result.blob).toEqual(blob);
      expect(result.mediaInfo.mimeType).toEqual("image/jpeg");
      expect(getMock).toHaveBeenCalledWith("/media/permalink/slug-1/by-id/m-1/info");
      expect(getMock).toHaveBeenCalledWith("/media/permalink/slug-1/by-id/m-1/download", {
        responseType: "blob",
      });
    });
  });
});
