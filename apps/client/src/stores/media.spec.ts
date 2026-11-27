import type { AxiosRequestConfig } from "axios";
import type { MediaInfo } from "../components/media/MediaInfo.interface";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../lib/api-client.ts";
import {
  eightMediaOnTwoPages,
  FIRST_PAGE,
  mediaFile,
  newestSixMedia,
  oldestTwoMedia,
  type ServedMediaPages,
  servedMediaPage,
} from "../testing-utils/fixtures/organization-media.ts";
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
          "uuid",
          "field",
          new File(["a"], "a.txt"),
          (p) => progressCalls.push(p),
        );
        expect(mediaId).toBe(`mid-${status}`);
        // Verify URL formatting
        expect(postMock).toHaveBeenLastCalledWith(
          expect.stringMatching(/\/media\/dpp\/uuid\/field$/),
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
      await apiClient.media.media.uploadDppMedia("uuid", "field", new File(["a"], "a.txt"), (p) =>
        progressCalls.push(p),
      );
      expect(progressCalls).toEqual([12300]);
    });

    it("throws on unexpected status", async () => {
      postMock.mockResolvedValueOnce({ status: 418, data: {} });
      await expect(
        apiClient.media.media.uploadDppMedia("uuid", "field", new File(["a"], "a.txt")),
      ).rejects.toThrow("Unexpected upload status 418");
    });
  });

  describe("getDppMediaInfo", () => {
    it("throws if no uuid provided", async () => {
      const store = useMediaStore();
      await expect(store.getDppMediaInfo(undefined, "field")).rejects.toThrow("No UUID provided");
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

  describe("the organization's media", () => {
    /** Answers the list endpoint per cursor, like the backend. */
    function serveOrganizationMedia(pages: ServedMediaPages, total: number) {
      getMock.mockImplementation(async (url: string, config?: AxiosRequestConfig) => {
        if (!url.endsWith("/media/by-organization")) {
          throw new Error(`Unexpected request ${url}`);
        }
        return { data: servedMediaPage(pages, total, config?.params?.cursor) };
      });
    }

    it("shows the first page, six files at a time", async () => {
      serveOrganizationMedia({ [FIRST_PAGE]: { result: newestSixMedia, next: "after-c" } }, 8);
      const store = useMediaStore();

      await store.showFirstOrganizationMediaPage();

      expect(store.organizationMedia).toEqual(newestSixMedia);
      expect(store.organizationMediaTotal).toBe(8);
      expect(getMock.mock.calls).toEqual([
        [expect.stringMatching(/\/media\/by-organization$/), { params: { limit: 6 } }],
      ]);
    });

    it("moves to the next page and back", async () => {
      serveOrganizationMedia(eightMediaOnTwoPages, 8);
      const store = useMediaStore();
      await store.showFirstOrganizationMediaPage();
      expect(store.hasNextOrganizationMediaPage).toBe(true);
      expect(store.hasPreviousOrganizationMediaPage).toBe(false);

      await store.showNextOrganizationMediaPage();

      expect(store.organizationMedia).toEqual(oldestTwoMedia);
      expect(store.organizationMediaPage).toMatchObject({ from: 6, itemCount: 2 });
      expect(store.hasNextOrganizationMediaPage).toBe(false);
      expect(store.hasPreviousOrganizationMediaPage).toBe(true);

      await store.showPreviousOrganizationMediaPage();

      expect(store.organizationMedia).toEqual(newestSixMedia);
      expect(store.organizationMediaPage).toMatchObject({ from: 0, itemCount: 6 });
    });

    it("loads the shown page again without replacing the files that stay", async () => {
      serveOrganizationMedia({ [FIRST_PAGE]: { result: newestSixMedia, next: "after-c" } }, 8);
      const store = useMediaStore();
      await store.showFirstOrganizationMediaPage();
      const shownBefore = [...store.organizationMedia];
      // "g" was deleted, so "b" moves up from the next page
      const withoutG = ["h", "f", "e", "d", "c", "b"].map(mediaFile);
      serveOrganizationMedia({ [FIRST_PAGE]: { result: withoutG, next: "after-b" } }, 7);

      await store.reloadOrganizationMediaPage();

      expect(store.organizationMedia).toEqual(withoutG);
      expect(store.organizationMediaTotal).toBe(7);
      // An entry that stays the same object gives its preview no reason to load the file again
      const stayed = shownBefore.filter((media) => media.id !== "g");
      store.organizationMedia.slice(0, 5).forEach((media, index) => {
        expect(media).toBe(stayed[index]);
      });
    });

    it("opens without the files of the later page an earlier grid was left on", async () => {
      serveOrganizationMedia(eightMediaOnTwoPages, 8);
      const store = useMediaStore();
      await store.showFirstOrganizationMediaPage();
      await store.showNextOrganizationMediaPage();

      const opening = store.openOrganizationMedia();

      // The first page is still on its way: the grid that opens must not show the second one
      expect(store.organizationMedia).toEqual([]);
      await opening;
      expect(store.organizationMedia).toEqual(newestSixMedia);
    });

    it("opens with the files of the first page when an earlier grid was left on it", async () => {
      serveOrganizationMedia({ [FIRST_PAGE]: { result: newestSixMedia, next: "after-c" } }, 8);
      const store = useMediaStore();
      await store.showFirstOrganizationMediaPage();

      const opening = store.openOrganizationMedia();

      expect(store.organizationMedia).toEqual(newestSixMedia);
      await opening;
      expect(store.organizationMedia).toEqual(newestSixMedia);
    });

    it("continues after a reload without repeating a file on a page seen before", async () => {
      const files = Array.from({ length: 14 }, (_, index) => mediaFile(`f${index + 1}`));
      serveOrganizationMedia(
        {
          [FIRST_PAGE]: { result: files.slice(0, 6), next: "after-f6" },
          "after-f6": { result: files.slice(6, 12), next: "after-f12" },
          "after-f12": { result: files.slice(12), next: null },
        },
        14,
      );
      const store = useMediaStore();
      await store.showFirstOrganizationMediaPage();
      await store.showNextOrganizationMediaPage();
      await store.showPreviousOrganizationMediaPage();
      // "f3" was deleted, so every file after it moves up by one
      const left = files.filter((media) => media.id !== "f3");
      serveOrganizationMedia(
        {
          [FIRST_PAGE]: { result: left.slice(0, 6), next: "after-f7" },
          "after-f7": { result: left.slice(6, 12), next: "after-f13" },
          "after-f13": { result: left.slice(12), next: null },
          // The cursor the third page had before the delete still answers
          "after-f12": { result: left.slice(11), next: null },
        },
        13,
      );

      await store.reloadOrganizationMediaPage();
      await store.showNextOrganizationMediaPage();
      await store.showNextOrganizationMediaPage();

      expect(store.organizationMedia).toEqual([mediaFile("f14")]);
      expect(store.organizationMediaPage).toMatchObject({ from: 12, itemCount: 1 });
    });

    it("replaces a file whose info changed since it was loaded", async () => {
      serveOrganizationMedia({ [FIRST_PAGE]: { result: oldestTwoMedia, next: null } }, 2);
      const store = useMediaStore();
      await store.showFirstOrganizationMediaPage();
      const [b, a] = oldestTwoMedia;
      const replacedB = { ...b, size: 4096 };
      serveOrganizationMedia({ [FIRST_PAGE]: { result: [replacedB, a], next: null } }, 2);

      await store.reloadOrganizationMediaPage();

      expect(store.organizationMedia).toEqual([replacedB, a]);
    });

    it("goes back a page when the shown page has no file left", async () => {
      serveOrganizationMedia(
        {
          [FIRST_PAGE]: { result: newestSixMedia, next: "after-c" },
          "after-c": { result: [mediaFile("b")], next: null },
        },
        7,
      );
      const store = useMediaStore();
      await store.showFirstOrganizationMediaPage();
      await store.showNextOrganizationMediaPage();
      // "b", the only file of the second page, was deleted
      serveOrganizationMedia(
        {
          [FIRST_PAGE]: { result: newestSixMedia, next: null },
          "after-c": { result: [], next: null },
        },
        6,
      );

      await store.reloadOrganizationMediaPage();

      expect(store.organizationMedia).toEqual(newestSixMedia);
      expect(store.organizationMediaPage).toMatchObject({ from: 0, itemCount: 6 });
      expect(store.hasNextOrganizationMediaPage).toBe(false);
    });
  });

  describe("downloadDppMedia", () => {
    it("throws if no uuid provided", async () => {
      const store = useMediaStore();
      await expect(store.downloadDppMedia(undefined, "field")).rejects.toThrow("No UUID provided");
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
