import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMediaStore } from "./media";
import { MediaInfo } from "../components/media/MediaInfo.interface";

// Mocks
const postMock = vi.fn();
const getMock = vi.fn();
vi.mock("../lib/axios", () => ({
  default: {
    post: (...args: never[]) => postMock(...args),
    get: (...args: never[]) => getMock(...args),
  },
}));
vi.mock("../const", () => ({
  MEDIA_SERVICE_URL: "http://media-service",
}));

describe("media store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    postMock.mockReset();
    getMock.mockReset();
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
        "http://media-service/media/dpp/uuid/field/info",
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
        "http://media-service/media/dpp/uuid/field/download",
        { responseType: "blob" },
      );
    });
  });

  describe("fetchDppMedia", () => {
    it("combines info and blob (contentType from info)", async () => {
      const store = useMediaStore();
      const blob = new Blob(["data"], { type: "application/octet-stream" });

      // Mock axios GET to return appropriate responses irrespective of call order
      getMock.mockImplementation((url: string) => {
        if (url.endsWith("/info")) {
          const info: MediaInfo = {
            id: "",
            title: "",
            size: 5,
            mimeType: "image/jpeg",
          };
          return Promise.resolve({ data: info });
        }
        if (url.endsWith("/download")) {
          return Promise.resolve({ data: blob });
        }
        return Promise.reject(new Error("unexpected url: " + url));
      });

      const result = await store.fetchDppMedia("uuid", "field");
      expect(result.blob).toEqual(blob);
      expect(result.mediaInfo.mimeType).toEqual("image/jpeg");
      expect(getMock).toHaveBeenCalledWith(
        "http://media-service/media/dpp/uuid/field/info",
      );
      expect(getMock).toHaveBeenCalledWith(
        "http://media-service/media/dpp/uuid/field/download",
        { responseType: "blob" },
      );
    });
  });
});
