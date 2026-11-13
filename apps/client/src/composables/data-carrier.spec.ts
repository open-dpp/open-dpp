import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, ref } from "vue";
import {
  type DataCarrierIdentity,
  type DataCarrierPermalink,
  useDataCarrier,
} from "./data-carrier.ts";

const { getCarrierExport, downloadBlob, logErrorWithNotification, addSuccessNotification } =
  vi.hoisted(() => ({
    getCarrierExport: vi.fn(),
    downloadBlob: vi.fn(),
    logErrorWithNotification: vi.fn(),
    addSuccessNotification: vi.fn(),
  }));

vi.mock("../lib/api-client", () => ({
  default: { dpp: { permalinks: { getCarrierExport } } },
}));
vi.mock("../lib/download", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/download")>()),
  downloadBlob,
}));
vi.mock("../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification }),
}));
vi.mock("../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification }),
}));
vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const openDppPermalink: DataCarrierPermalink = {
  id: "11111111-1111-4111-8111-111111111111",
  kind: "open-dpp",
  publicUrl: "https://cloud.open-dpp.de/p/11111111-1111-4111-8111-111111111111",
};

const gs1Permalink: DataCarrierPermalink = {
  ...openDppPermalink,
  kind: "gs1-link",
  publicUrl: "https://cloud.open-dpp.de/01/09501101020917/21/SER-1",
};

function setup(
  initialPermalink: DataCarrierPermalink = openDppPermalink,
  initialIdentity: DataCarrierIdentity | null = null,
) {
  const permalink = ref(initialPermalink);
  const identity = ref(initialIdentity);
  const scope = effectScope();
  const carrier = scope.run(() => useDataCarrier(permalink, identity))!;
  return { carrier, permalink, identity, dispose: () => scope.stop() };
}

describe("useDataCarrier", () => {
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();
  const writeText = vi.fn();

  function setClipboard(clipboard: { writeText: typeof writeText } | undefined) {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: clipboard,
      configurable: true,
    });
  }

  beforeEach(() => {
    vi.resetAllMocks();
    let objectUrls = 0;
    createObjectURL.mockImplementation(() => `blob:carrier-${++objectUrls}`);
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURL;
    getCarrierExport.mockImplementation(async (id: string, params: { format: string }) => ({
      data: new Blob([params.format === "svg" ? "<svg/>" : "png"]),
      headers: {
        "content-disposition": `attachment; filename="data-carrier-${id}.${params.format}"`,
      },
    }));
    writeText.mockResolvedValue(undefined);
    setClipboard({ writeText });
  });

  describe("the shown Data Carrier", () => {
    it("is the permalink's SVG at the default settings", async () => {
      const { carrier } = setup();
      await flushPromises();

      expect(getCarrierExport).toHaveBeenCalledWith(openDppPermalink.id, { format: "svg" });
      const blob = createObjectURL.mock.calls[0][0] as Blob;
      expect(blob.type).toBe("image/svg+xml");
      expect(carrier.imageUrl.value).toBe("blob:carrier-1");
      expect(carrier.loadFailed.value).toBe(false);
    });

    it("is reloaded and the old one released when the permalink changes", async () => {
      const { carrier, permalink } = setup();
      await flushPromises();

      const other = { ...openDppPermalink, id: "22222222-2222-4222-8222-222222222222" };
      permalink.value = other;
      await flushPromises();

      expect(getCarrierExport).toHaveBeenLastCalledWith(other.id, { format: "svg" });
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:carrier-1");
      expect(carrier.imageUrl.value).toBe("blob:carrier-2");
    });

    it("is reloaded when only the public URL changes, because it encodes that URL", async () => {
      const { carrier, permalink } = setup();
      await flushPromises();

      permalink.value = { ...openDppPermalink, publicUrl: "https://example.com/p/new" };
      await flushPromises();

      expect(getCarrierExport).toHaveBeenCalledTimes(2);
      expect(carrier.imageUrl.value).toBe("blob:carrier-2");
    });

    it("is not reloaded when the permalink is replaced by an equal one", async () => {
      const { carrier, permalink } = setup();
      await flushPromises();

      permalink.value = { ...openDppPermalink };
      await flushPromises();

      expect(getCarrierExport).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).not.toHaveBeenCalled();
      expect(carrier.imageUrl.value).toBe("blob:carrier-1");
    });

    it("is not the old one while the new permalink's SVG loads", async () => {
      const { carrier, permalink } = setup();
      await flushPromises();

      getCarrierExport.mockImplementationOnce(() => new Promise(() => {}));
      permalink.value = { ...openDppPermalink, id: "22222222-2222-4222-8222-222222222222" };
      await flushPromises();

      expect(revokeObjectURL).toHaveBeenCalledWith("blob:carrier-1");
      expect(carrier.imageUrl.value).toBeNull();
    });

    it("ignores a response that arrives after the permalink changed", async () => {
      let resolveFirst!: (value: { data: Blob }) => void;
      getCarrierExport.mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = resolve)),
      );
      const { carrier, permalink } = setup();
      permalink.value = { ...openDppPermalink, id: "22222222-2222-4222-8222-222222222222" };
      await flushPromises();

      resolveFirst({ data: new Blob(["<svg>stale</svg>"]) });
      await flushPromises();

      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(carrier.imageUrl.value).toBe("blob:carrier-1");
    });

    it("is released when the scope is disposed", async () => {
      const { carrier, dispose } = setup();
      await flushPromises();

      dispose();

      expect(revokeObjectURL).toHaveBeenCalledWith("blob:carrier-1");
      expect(carrier.imageUrl.value).toBeNull();
    });

    it("is never created from a response that arrives after the scope is disposed", async () => {
      let resolveLoad!: (value: { data: Blob }) => void;
      getCarrierExport.mockImplementationOnce(
        () => new Promise((resolve) => (resolveLoad = resolve)),
      );
      const { carrier, dispose } = setup();

      dispose();
      resolveLoad({ data: new Blob(["<svg/>"]) });
      await flushPromises();

      expect(createObjectURL).not.toHaveBeenCalled();
      expect(carrier.imageUrl.value).toBeNull();
    });

    it("reports a failed load", async () => {
      const error = new Error("network");
      getCarrierExport.mockRejectedValueOnce(error);

      const { carrier } = setup();
      await flushPromises();

      expect(carrier.imageUrl.value).toBeNull();
      expect(carrier.loadFailed.value).toBe(true);
      expect(logErrorWithNotification).toHaveBeenCalledWith("dataCarrier.loadError", error);
    });

    it("clears a failed load once the next permalink loads", async () => {
      getCarrierExport.mockRejectedValueOnce(new Error("network"));
      const { carrier, permalink } = setup();
      await flushPromises();

      permalink.value = { ...openDppPermalink, id: "22222222-2222-4222-8222-222222222222" };
      await flushPromises();

      expect(carrier.loadFailed.value).toBe(false);
      expect(carrier.imageUrl.value).toBe("blob:carrier-1");
    });
  });

  describe("download", () => {
    it.each(["svg", "png"] as const)(
      "saves the %s at the default settings under the name the server suggests",
      async (format) => {
        const { carrier } = setup();
        await flushPromises();

        await carrier.download(format);

        expect(getCarrierExport).toHaveBeenLastCalledWith(openDppPermalink.id, { format });
        expect(downloadBlob).toHaveBeenCalledWith(
          expect.any(Blob),
          `data-carrier-${openDppPermalink.id}.${format}`,
        );
      },
    );

    it("falls back to a generic name when the server suggests none", async () => {
      const { carrier } = setup();
      await flushPromises();
      getCarrierExport.mockResolvedValueOnce({ data: new Blob(["png"]), headers: {} });

      await carrier.download("png");

      expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), "data-carrier.png");
    });

    it("marks the format as downloading until the request settles", async () => {
      const { carrier } = setup();
      await flushPromises();
      let resolveDownload!: (value: { data: Blob; headers: object }) => void;
      getCarrierExport.mockImplementationOnce(
        () => new Promise((resolve) => (resolveDownload = resolve)),
      );

      const pending = carrier.download("png");
      expect(carrier.downloading.value).toBe("png");

      resolveDownload({ data: new Blob(["png"]), headers: {} });
      await pending;
      expect(carrier.downloading.value).toBeNull();
    });

    it("reports a failed download and stops downloading", async () => {
      const { carrier } = setup();
      await flushPromises();
      const error = new Error("network");
      getCarrierExport.mockRejectedValueOnce(error);

      await carrier.download("png");

      expect(downloadBlob).not.toHaveBeenCalled();
      expect(logErrorWithNotification).toHaveBeenCalledWith("dataCarrier.downloadError", error);
      expect(carrier.downloading.value).toBeNull();
    });
  });

  describe("copyUrl", () => {
    it("copies the public URL and confirms it", async () => {
      const { carrier } = setup();

      await carrier.copyUrl();

      expect(writeText).toHaveBeenCalledWith(openDppPermalink.publicUrl);
      expect(addSuccessNotification).toHaveBeenCalledWith("common.clipboardSuccess");
      expect(logErrorWithNotification).not.toHaveBeenCalled();
    });

    it("does nothing without a public URL", async () => {
      const { carrier } = setup({ ...openDppPermalink, publicUrl: "" });

      await carrier.copyUrl();

      expect(writeText).not.toHaveBeenCalled();
      expect(addSuccessNotification).not.toHaveBeenCalled();
    });

    it("reports an error instead of success when the clipboard is unavailable", async () => {
      setClipboard(undefined);
      const { carrier } = setup();

      await carrier.copyUrl();

      expect(addSuccessNotification).not.toHaveBeenCalled();
      expect(logErrorWithNotification).toHaveBeenCalledWith(
        "dataCarrier.copyError",
        expect.any(Error),
      );
    });

    it("reports an error instead of success when the clipboard write is rejected", async () => {
      const error = new DOMException("Write permission denied", "NotAllowedError");
      writeText.mockRejectedValue(error);
      const { carrier } = setup();

      await carrier.copyUrl();

      expect(addSuccessNotification).not.toHaveBeenCalled();
      expect(logErrorWithNotification).toHaveBeenCalledWith("dataCarrier.copyError", error);
    });
  });

  describe("URL label and element string", () => {
    it("labels a GS1 Digital Link and formats its element string", () => {
      const { carrier } = setup(gs1Permalink, { gtin: "09501101020917", serial: "SER-1" });

      expect(carrier.url.value).toBe(gs1Permalink.publicUrl);
      expect(carrier.urlLabel.value).toBe("dataCarrier.digitalLink.label");
      expect(carrier.elementString.value).toBe("(01) 09501101020917 (21) SER-1");
    });

    it("labels any other permalink as its public URL and has no element string", () => {
      const { carrier } = setup(openDppPermalink, { gtin: "09501101020917", serial: "SER-1" });

      expect(carrier.urlLabel.value).toBe("permalink.list.publicUrl");
      expect(carrier.elementString.value).toBeUndefined();
    });

    it("has no element string for a GS1 Digital Link without an identity", () => {
      const { carrier } = setup(gs1Permalink, null);

      expect(carrier.elementString.value).toBeUndefined();
    });

    it("follows an identity that changes", () => {
      const { carrier, identity } = setup(gs1Permalink, null);

      identity.value = { gtin: "09501101020917", batch: "LOT-7" };

      expect(carrier.elementString.value).toBe("(01) 09501101020917 (10) LOT-7");
    });

    it("logs and leaves out an element string it cannot format", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const { carrier } = setup(gs1Permalink, { gtin: "123" });

      expect(carrier.elementString.value).toBeUndefined();
      expect(consoleError).toHaveBeenCalledWith(
        "Cannot format the GS1 element string",
        expect.any(Error),
      );
      consoleError.mockRestore();
    });
  });
});
