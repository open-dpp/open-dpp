import type { AxiosRequestConfig } from "axios";
import type { MediaInfo } from "../components/media/MediaInfo.interface";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMediaStore } from "./media";

// Mocks
const postMock = vi.fn();
vi.mock("../lib/axios", () => ({
  default: {
    post: (...args: never[]) => postMock(...args),
  },
}));
vi.mock("../const", () => ({
  MEDIA_SERVICE_URL: "http://media-service",
}));

const mocks = vi.hoisted(() => {
  return {

    getMediaInfoByOrganization: vi.fn(),
    getMediaInfo: vi.fn(),
    getMediaInfoOfDataField: vi.fn(),
    download: vi.fn(),
    downloadMediaOfDataField: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    media: {
      media: {
        getMediaInfoByOrganization: mocks.getMediaInfoByOrganization,
        getMediaInfo: mocks.getMediaInfo,
        getMediaInfoOfDataField: mocks.getMediaInfoOfDataField,
        download: mocks.download,
        downloadMediaOfDataField: mocks.downloadMediaOfDataField,
      },
    },
  },
}));

describe("media store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    postMock.mockReset();
  });

  describe("uploadDppMedia", () => {
    it("throws if no organization selected", async () => {
      const store = useMediaStore();
      await expect(
        store.uploadDppMedia(null, "uuid", "field", new File(["a"], "a.txt")),
      ).rejects.toThrow("No organization selected");
    });

    it("throws if no uuid provided", async () => {
      const store = useMediaStore();
      await expect(
        store.uploadDppMedia(
          "org",
          undefined,
          "field",
          new File(["a"], "a.txt"),
        ),
      ).rejects.toThrow("No UUID provided");
    });

    it("returns mediaId on 200/201/304 and calls progress handler", async () => {
      const store = useMediaStore();
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
        const mediaId = await store.uploadDppMedia(
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
            /^http:\/\/media-service\/media\/dpp\/org\/uuid\/field$/,
          ),
          expect.any(FormData),
          expect.objectContaining({ onUploadProgress: expect.any(Function) }),
        );
        expect(progressCalls).toEqual([50]);
      }
    });

    it("computes progress even if total is undefined (uses 1)", async () => {
      const store = useMediaStore();
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
      await store.uploadDppMedia(
        "org",
        "uuid",
        "field",
        new File(["a"], "a.txt"),
        p => progressCalls.push(p),
      );
      expect(progressCalls).toEqual([12300]);
    });

    it("throws on unexpected status", async () => {
      const store = useMediaStore();
      postMock.mockResolvedValueOnce({ status: 418, data: {} });
      await expect(
        store.uploadDppMedia("org", "uuid", "field", new File(["a"], "a.txt")),
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
      mocks.getMediaInfoOfDataField.mockResolvedValueOnce({ data: info });
      const result = await store.getDppMediaInfo("uuid", "field");
      expect(result).toEqual(info);
      expect(mocks.getMediaInfoOfDataField).toHaveBeenCalledWith(
        "uuid",
        "field",
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
      mocks.downloadMediaOfDataField.mockResolvedValueOnce({ data: blob });
      const result = await store.downloadDppMedia("uuid", "field");
      expect(result).toEqual(blob);
      expect(mocks.downloadMediaOfDataField).toHaveBeenCalledWith(
        "uuid",
        "field",
      );
    });
  });

  describe("fetchDppMedia", () => {
    it("combines info and blob (contentType from info)", async () => {
      const store = useMediaStore();
      const blob = new Blob(["data"], { type: "application/octet-stream" });

      // Mock axios GET to return appropriate responses irrespective of call order
      mocks.getMediaInfoOfDataField.mockResolvedValue({ data: {
        id: "",
        title: "",
        size: 5,
        mimeType: "image/jpeg",
      } });
      mocks.downloadMediaOfDataField.mockResolvedValue({ data: blob });

      const result = await store.fetchDppMedia("uuid", "field");
      expect(result.blob).toEqual(blob);
      expect(result.mediaInfo.mimeType).toEqual("image/jpeg");
      expect(mocks.getMediaInfoOfDataField).toHaveBeenCalledWith(
        "uuid",
        "field",
      );
      expect(mocks.downloadMediaOfDataField).toHaveBeenCalledWith(
        "uuid",
        "field",
      );
    });
  });
});
