import { mount } from "@vue/test-utils";
import { expect, vi } from "vitest";
import { defineComponent, nextTick } from "vue";
import { generatedErrorHandlingStoreMock } from "../testing-utils/error-handling-store-mock.ts";
import { useMediaFileCollection } from "./media-file";

const mocks = vi.hoisted(() => {
  return {
    logErrorNotification: vi.fn(),
  };
});

const fetchMediaMock
  = vi.fn<
    (
      mediaId: string,
    ) => Promise<{ blob: Blob | null; mediaInfo: { id: string } }>
  >();

vi.mock("../stores/media.ts", () => ({
  useMediaStore: () => ({
    fetchMedia: fetchMediaMock,
  }),
}));

describe("useMediaFileCollection", () => {
  const createObjectURLMock = vi.fn((blob: Blob) => {
    return `blob:mock/${blob.size}`;
  });
  const revokeObjectURLMock = vi.fn();

  beforeEach(() => {
    fetchMediaMock.mockReset();

    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();

    vi.stubGlobal("URL", {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
  const translate = (key: string) => key;

  const errorHandlingStore = generatedErrorHandlingStoreMock(
    mocks.logErrorNotification,
  );

  function mountHarness() {
    const Harness = defineComponent({
      name: "MediaFileCollectionHarness",
      setup() {
        const api = useMediaFileCollection({ errorHandlingStore, translate });
        return { api };
      },
      template: "<div />",
    });

    const wrapper = mount(Harness);
    return {
      wrapper,
      api: wrapper.vm.api as ReturnType<typeof useMediaFileCollection>,
    };
  }

  it("downloads files and creates object URLs for blobs (keeps empty url for null blobs)", async () => {
    fetchMediaMock.mockImplementation(async (mediaId: string) => ({
      blob: new Blob(["hello"], { type: "text/plain" }),
      mediaInfo: { id: mediaId },
    }));

    const { api } = mountHarness();

    const { download, files } = api;

    await download(["a", "b"]);
    await nextTick();

    expect(fetchMediaMock).toHaveBeenCalledTimes(2);
    expect(createObjectURLMock).toHaveBeenCalledTimes(2);

    expect(files.value).toHaveLength(2);
    expect(files.value[0]!.mediaInfo.id).toBe("a");
    expect(files.value[0]!.url).toMatch(/^blob:mock\//);

    expect(files.value[1]!.mediaInfo.id).toBe("b");
    expect(files.value[1]!.url).toMatch(/^blob:mock\//);
  });

  it("removes file", async () => {
    fetchMediaMock.mockImplementation(async (mediaId: string) => ({
      blob: new Blob(["hello"], { type: "text/plain" }),
      mediaInfo: { id: mediaId },
    }));
    const { api } = mountHarness();

    const { download, files, remove } = api;

    await download(["a", "b"]);
    await nextTick();

    await download(["a", "b"]);
    expect(files.value).toHaveLength(2);
    await remove("a");
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock/5");
    expect(files.value).toHaveLength(1);
    expect(files.value[0]!.mediaInfo.id).toBe("b");
  });

  it("add file", async () => {
    fetchMediaMock.mockImplementation(async (mediaId: string) => ({
      blob: new Blob(["hello"], { type: "text/plain" }),
      mediaInfo: { id: mediaId },
    }));
    const { api } = mountHarness();

    const { download, files, add } = api;

    await download(["a", "b"]);
    await nextTick();

    expect(files.value).toHaveLength(2);

    await add("c");
    expect(createObjectURLMock).toHaveBeenCalledTimes(3);
    expect(files.value).toHaveLength(3);
    expect(files.value[2]!.mediaInfo.id).toBe("c");
    await add("b");
    expect(files.value).toHaveLength(3);
    expect(files.value[1]!.mediaInfo.id).toBe("b");
  });

  it("move file", async () => {
    fetchMediaMock.mockImplementation(async (mediaId: string) => ({
      blob: new Blob(["hello"], { type: "text/plain" }),
      mediaInfo: { id: mediaId },
    }));
    const { api } = mountHarness();

    const { download, files, move } = api;

    await download(["a", "b", "c"]);
    await nextTick();

    expect(files.value).toHaveLength(3);

    move("c", 1);
    expect(files.value).toHaveLength(3);
    expect(files.value.map(m => m.mediaInfo.id)).toEqual(["a", "c", "b"]);
  });

  it("modify file", async () => {
    fetchMediaMock.mockImplementation(async (mediaId: string) => ({
      blob: new Blob(["hello"], { type: "text/plain" }),
      mediaInfo: { id: mediaId },
    }));
    const { api } = mountHarness();

    const { download, files, modify } = api;

    await download(["a", "b", "c"]);
    await nextTick();

    expect(files.value).toHaveLength(3);

    await modify("b", "d");
    await modify("a", "e");
    expect(files.value).toHaveLength(3);
    expect(files.value.map(m => m.mediaInfo.id)).toEqual(["e", "d", "c"]);
  });
});
