import { createPinia, setActivePinia } from "pinia";
import { expect, it, vi } from "vitest";
import { modelFactory } from "../testing-utils/fixtures/model.factory.ts";
import { useModelsMediaStore } from "./models.media.edit.ts";

const mocks = vi.hoisted(() => {
  return {
    getModelById: vi.fn(),
    addMediaReference: vi.fn(),
    deleteMediaReference: vi.fn(),
    moveMediaReference: vi.fn(),
    modifyMediaReference: vi.fn(),
    getMediaInfo: vi.fn(),
    download: vi.fn(),
    mockObjectURL: vi.fn(),
  };
});

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key, // This will return the key itself as the translation
  }),
}));

vi.mock("../lib/media", () => {
  return {
    createObjectUrl: mocks.mockObjectURL,
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      models: {
        getById: mocks.getModelById,
        addMediaReference: mocks.addMediaReference,
        deleteMediaReference: mocks.deleteMediaReference,
        moveMediaReference: mocks.moveMediaReference,
        modifyMediaReference: mocks.modifyMediaReference,
      },
    },
    media: {
      media: {
        getMediaInfo: mocks.getMediaInfo,
        download: mocks.download,
      },
    },
  },
}));

describe("modelsMediaStore", () => {
  const mediaReference1 = "m1";
  const mediaReference2 = "m2";
  const blob1 = new Blob(["data1"], { type: "application/octet-stream" });
  const mediaInfo1 = {
    id: mediaReference1,
    title: "Media m1",
    size: 5,
    mimeType: "image/jpeg",
  };
  const blob2 = new Blob(["data"], { type: "application/octet-stream" });
  const mediaInfo2 = {
    id: mediaReference2,
    title: "Media m2",
    size: 5,
    mimeType: "image/jpeg",
  };
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
    // mock first media file
    mocks.getMediaInfo.mockResolvedValueOnce({ data: mediaInfo1 });
    mocks.download.mockResolvedValueOnce({ status: 200, data: blob1 });
    mocks.mockObjectURL.mockReturnValueOnce("mockObjectURL1");
    // mock second media file
    mocks.getMediaInfo.mockResolvedValueOnce({ data: mediaInfo2 });
    mocks.download.mockResolvedValueOnce({ status: 200, data: blob2 });
    mocks.mockObjectURL.mockReturnValueOnce("mockObjectURL2");
  });
  afterEach(() => {
    vi.restoreAllMocks(); // This will restore URL.createObjectURL to its original implementation
  });

  it("should add media reference", async () => {
    const modelsMediaStore = useModelsMediaStore();
    const model = modelFactory.build({ mediaReferences: [mediaReference1] });
    mocks.getModelById.mockResolvedValue({ data: model });
    await modelsMediaStore.fetchModel(model.id);
    await modelsMediaStore.loadMedia();
    mocks.addMediaReference.mockResolvedValueOnce({
      data: { ...model, mediaReferences: [mediaReference1, mediaReference2] },
    });
    await modelsMediaStore.addMediaReference(mediaInfo2);
    expect(modelsMediaStore.mediaFiles).toEqual([
      {
        blob: blob1,
        mediaInfo: mediaInfo1,
        url: "mockObjectURL1",
      },
      {
        blob: blob2,
        mediaInfo: mediaInfo2,
        url: "mockObjectURL2",
      },
    ]);
  });

  it("should delete media reference", async () => {
    const modelsMediaStore = useModelsMediaStore();
    const model = modelFactory.build({ mediaReferences: [mediaReference1, mediaReference2] });
    mocks.getModelById.mockResolvedValue({ data: model });
    await modelsMediaStore.fetchModel(model.id);
    await modelsMediaStore.loadMedia();
    mocks.deleteMediaReference.mockResolvedValueOnce({
      data: { ...model, mediaReferences: [mediaReference1] },
    });
    await modelsMediaStore.removeMediaReference(mediaInfo2);
    expect(mocks.deleteMediaReference).toHaveBeenCalledWith(model.id, mediaInfo2.id);
    expect(modelsMediaStore.mediaFiles).toEqual([
      {
        blob: blob1,
        mediaInfo: mediaInfo1,
        url: "mockObjectURL1",
      },
    ]);
  });

  it("should move media reference", async () => {
    const modelsMediaStore = useModelsMediaStore();
    const model = modelFactory.build({ mediaReferences: [mediaReference1, mediaReference2] });
    mocks.getModelById.mockResolvedValue({ data: model });
    await modelsMediaStore.fetchModel(model.id);
    await modelsMediaStore.loadMedia();
    mocks.moveMediaReference.mockResolvedValueOnce({
      data: { ...model, mediaReferences: [mediaReference2, mediaReference1] },
    });
    await modelsMediaStore.moveMediaReference(mediaInfo2, 0);
    expect(mocks.moveMediaReference).toHaveBeenCalledWith(model.id, mediaInfo2.id, { position: 0 });
    expect(modelsMediaStore.mediaFiles).toEqual([
      {
        blob: blob2,
        mediaInfo: mediaInfo2,
        url: "mockObjectURL2",
      },
      {
        blob: blob1,
        mediaInfo: mediaInfo1,
        url: "mockObjectURL1",
      },
    ]);
  });

  it("should modify media reference", async () => {
    const modelsMediaStore = useModelsMediaStore();
    const model = modelFactory.build({ mediaReferences: [mediaReference1] });
    mocks.getModelById.mockResolvedValue({ data: model });
    await modelsMediaStore.fetchModel(model.id);
    await modelsMediaStore.loadMedia();
    mocks.modifyMediaReference.mockResolvedValueOnce({
      data: { ...model, mediaReferences: [mediaReference2] },
    });
    await modelsMediaStore.modifyMediaReference(mediaInfo1, mediaInfo2);
    expect(mocks.modifyMediaReference).toHaveBeenCalledWith(model.id, mediaInfo1.id, { id: mediaInfo2.id });
    expect(modelsMediaStore.mediaFiles).toEqual([
      {
        blob: blob2,
        mediaInfo: mediaInfo2,
        url: "mockObjectURL2",
      },
    ]);
  });
});
