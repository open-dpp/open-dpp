import type { AxiosRequestConfig } from "axios";
import type { MediaInfo } from "../components/media/MediaInfo.interface";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../lib/api-client.ts";
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

  describe("uploadDppMedia", () => {
    it("throws if no organization selected", async () => {
      await expect(
        apiClient.media.media.uploadDppMedia(null, "uuid", "field", new File(["a"], "a.txt")),
      ).rejects.toThrow("No organization selected");
    });

    it("throws if no uuid provided", async () => {
      await expect(
        apiClient.media.media.uploadDppMedia(
          "org",
          undefined,
          "field",
          new File(["a"], "a.txt"),
        ),
      ).rejects.toThrow("No UUID provided");
    });

    it("returns mediaId on 200/201/304 and calls progress handler", async () => {
      const statuses = [200, 201, 304] as const;
      for (const status of statuses) {
        postMock.mockImplementationOnce(
          (url: string, formData: FormData, config: AxiosRequestConfig) => {
            // simulate upload progress
            config?.onUploadProgress?.({ loaded: 50, total: 100 } as never);
            return Promise.resolve({
              status,
              data: { mediaId: `mid-${status}` },
            });
          },
        );
        const progressCalls: number[] = [];
        const mediaId = await apiClient.media.media.uploadDppMedia(
          "org",
          "uuid",
          "field",
          new File(["a"], "a.txt"),
          p => progressCalls.push(p),
        );
        expect(mediaId).toBe(`mid-${status}`);
        // Verify URL formatting
        expect(postMock).toHaveBeenLastCalledWith(
          expect.stringMatching(
            /\/media\/media\/dpp\/org\/uuid\/field$/,
          ),
          expect.any(FormData),
          expect.objectContaining({ onUploadProgress: expect.any(Function) }),
        );
        expect(progressCalls).toEqual([50]);
      }
    });

    it("computes progress even if total is undefined (uses 1)", async () => {
      postMock.mockImplementationOnce(
        (url: string, formData: FormData, config: AxiosRequestConfig) => {
          config?.onUploadProgress?.({
            loaded: 123,
            total: undefined,
          } as never);
          return Promise.resolve({ status: 200, data: { mediaId: "mid" } });
        },
      );
      const progressCalls: number[] = [];
      await apiClient.media.media.uploadDppMedia(
        "org",
        "uuid",
        "field",
        new File(["a"], "a.txt"),
        p => progressCalls.push(p),
      );
      expect(progressCalls).toEqual([12300]);
    });

    it("throws on unexpected status", async () => {
      postMock.mockResolvedValueOnce({ status: 418, data: {} });
      await expect(
        apiClient.media.media.uploadDppMedia("org", "uuid", "field", new File(["a"], "a.txt")),
      ).rejects.toThrow("Unexpected upload status 418");
    });
  });

  describe("getDppMediaInfo", () => {
    it("throws if no uuid provided", async () => {
      const store = useMediaStore();
      await expect(store.getDppMediaInfo(undefined, "field")).rejects.toThrow(
        "No UUID provided",
      );
    });

    it("returns media info from endpoint", async () => {
      const store = useMediaStore();
      const info: MediaInfo = {
        id: "",
        title: "",
        size: 5,
        mimeType: "image/png",
      };
      getMock.mockResolvedValueOnce({ data: info });
      const result = await store.getDppMediaInfo("uuid", "field");
      expect(result).toEqual(info);
      expect(getMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/media\/dpp\/uuid\/field\/info$/),
      );
    });
  });

  describe("downloadDppMedia", () => {
    it("throws if no uuid provided", async () => {
      const store = useMediaStore();
      await expect(store.downloadDppMedia(undefined, "field")).rejects.toThrow(
        "No UUID provided",
      );
    });

    it("returns blob from endpoint", async () => {
      const store = useMediaStore();
      const blob = new Blob(["hello"], { type: "text/plain" });
      getMock.mockResolvedValueOnce({ data: blob });
      const result = await store.downloadDppMedia("uuid", "field");
      expect(result).toEqual(blob);
      expect(getMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/media\/dpp\/uuid\/field\/download$/),
        expect.any(Object),
      );
    });
  });

  describe("fetchDppMedia", () => {
    it("combines info and blob (contentType from info)", async () => {
      const store = useMediaStore();
      const blob = new Blob(["data"], { type: "application/octet-stream" });

      // Mock axios GET to return appropriate responses irrespective of call order
      getMock.mockImplementation((url: string) => {
        if (url.includes("/info")) {
          return Promise.resolve({
            data: {
              id: "",
              title: "",
              size: 5,
              mimeType: "image/jpeg",
            },
          });
        }
        if (url.includes("/download")) {
          return Promise.resolve({ data: blob });
        }
        return Promise.reject(new Error(`Unexpected URL ${url}`));
      });

      const result = await store.fetchDppMedia("uuid", "field");
      expect(result.blob).toEqual(blob);
      expect(result.mediaInfo.mimeType).toEqual("image/jpeg");
      expect(getMock).toHaveBeenCalledTimes(2);
    });
  });
});
