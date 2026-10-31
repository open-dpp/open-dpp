import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";

const { getCarrierExport, downloadBlob, logErrorWithNotification, addSuccessNotification, copy } =
  vi.hoisted(() => ({
    getCarrierExport: vi.fn(),
    downloadBlob: vi.fn(),
    logErrorWithNotification: vi.fn(),
    addSuccessNotification: vi.fn(),
    copy: vi.fn(),
  }));

vi.mock("../../lib/api-client", () => ({
  default: { dpp: { permalinks: { getCarrierExport } } },
}));
vi.mock("../../lib/download", () => ({ downloadBlob }));
vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification }),
}));
vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification }),
}));
vi.mock("@vueuse/core", () => ({ useClipboard: () => ({ copy }) }));

// PrimeVue's Button is auto-imported in the app but not under vitest
const ButtonStub = defineComponent({
  name: "Button",
  props: ["label", "icon", "severity", "variant", "disabled", "loading"],
  emits: ["click"],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        "button",
        { ...attrs, disabled: props.disabled, onClick: (e: Event) => emit("click", e) },
        props.label ?? "",
      );
  },
});

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      common: { copy: "Copy", clipboardSuccess: "Copied" },
      permalink: { list: { publicUrl: "Public URL" } },
      dataCarrier: {
        image: { alt: "Data carrier for {url}" },
        digitalLink: { label: "GS1 Digital Link" },
        elementString: { label: "GS1 element string" },
        download: { svg: "Download SVG", png: "Download PNG" },
        loadError: "The data carrier could not be loaded.",
        downloadError: "The data carrier could not be downloaded.",
      },
    },
  },
});

import DataCarrier from "./DataCarrier.vue";

const openDppPermalink = {
  id: "11111111-1111-4111-8111-111111111111",
  kind: "open-dpp" as const,
  publicUrl: "https://cloud.open-dpp.de/p/11111111-1111-4111-8111-111111111111",
};

function mountDataCarrier(props: Record<string, unknown> = {}) {
  return mount(DataCarrier, {
    props: { permalink: openDppPermalink, ...props },
    global: { plugins: [i18n], stubs: { Button: ButtonStub } },
  });
}

describe("DataCarrier", () => {
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    let objectUrls = 0;
    createObjectURL.mockImplementation(() => `blob:carrier-${++objectUrls}`);
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURL;
    getCarrierExport.mockImplementation(async (_id: string, params: { format: string }) => ({
      data: new Blob([params.format === "svg" ? "<svg/>" : "png"]),
    }));
  });

  it("shows the server-rendered SVG of the permalink", async () => {
    const wrapper = mountDataCarrier();
    await flushPromises();

    expect(getCarrierExport).toHaveBeenCalledWith(openDppPermalink.id, { format: "svg" });
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("image/svg+xml");
    const image = wrapper.get("[data-testid='data-carrier-image']");
    expect(image.attributes("src")).toBe("blob:carrier-1");
    expect(image.attributes("alt")).toBe(`Data carrier for ${openDppPermalink.publicUrl}`);
  });

  it("loads the new SVG and releases the old one when the permalink changes", async () => {
    const wrapper = mountDataCarrier();
    await flushPromises();

    const other = { ...openDppPermalink, id: "22222222-2222-4222-8222-222222222222" };
    await wrapper.setProps({ permalink: other });
    await flushPromises();

    expect(getCarrierExport).toHaveBeenLastCalledWith(other.id, { format: "svg" });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:carrier-1");
    expect(wrapper.get("[data-testid='data-carrier-image']").attributes("src")).toBe(
      "blob:carrier-2",
    );
  });

  it("ignores a response that arrives after the permalink changed", async () => {
    let resolveFirst!: (value: { data: Blob }) => void;
    getCarrierExport.mockImplementationOnce(
      () => new Promise((resolve) => (resolveFirst = resolve)),
    );
    const wrapper = mountDataCarrier();
    const other = { ...openDppPermalink, id: "22222222-2222-4222-8222-222222222222" };
    await wrapper.setProps({ permalink: other });
    await flushPromises();

    resolveFirst({ data: new Blob(["<svg>stale</svg>"]) });
    await flushPromises();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(wrapper.get("[data-testid='data-carrier-image']").attributes("src")).toBe(
      "blob:carrier-1",
    );
  });

  it("releases the SVG when it unmounts", async () => {
    const wrapper = mountDataCarrier();
    await flushPromises();

    wrapper.unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:carrier-1");
  });

  it("tells the user when the SVG cannot be loaded", async () => {
    const error = new Error("network");
    getCarrierExport.mockRejectedValueOnce(error);

    const wrapper = mountDataCarrier();
    await flushPromises();

    expect(wrapper.find("[data-testid='data-carrier-image']").exists()).toBe(false);
    expect(wrapper.get("[data-testid='data-carrier-load-error']").text()).toBe(
      "The data carrier could not be loaded.",
    );
    expect(logErrorWithNotification).toHaveBeenCalledWith(
      "The data carrier could not be loaded.",
      error,
    );
  });

  it.each([
    ["svg", "data-carrier-download-svg"],
    ["png", "data-carrier-download-png"],
  ])("downloads the %s at the default settings", async (format, testId) => {
    const wrapper = mountDataCarrier();
    await flushPromises();

    await wrapper.get(`[data-testid='${testId}']`).trigger("click");
    await flushPromises();

    expect(getCarrierExport).toHaveBeenLastCalledWith(openDppPermalink.id, { format });
    expect(downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      `data-carrier-${openDppPermalink.id}.${format}`,
    );
  });

  it("names the download after the slug when the permalink has one", async () => {
    const wrapper = mountDataCarrier({ permalink: { ...openDppPermalink, slug: "my-product" } });
    await flushPromises();

    await wrapper.get("[data-testid='data-carrier-download-png']").trigger("click");
    await flushPromises();

    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), "data-carrier-my-product.png");
  });

  it("tells the user when the download fails", async () => {
    const wrapper = mountDataCarrier();
    await flushPromises();
    const error = new Error("network");
    getCarrierExport.mockRejectedValueOnce(error);

    await wrapper.get("[data-testid='data-carrier-download-png']").trigger("click");
    await flushPromises();

    expect(downloadBlob).not.toHaveBeenCalled();
    expect(logErrorWithNotification).toHaveBeenCalledWith(
      "The data carrier could not be downloaded.",
      error,
    );
  });

  it("shows and copies the public URL", async () => {
    const wrapper = mountDataCarrier();
    await flushPromises();

    expect(wrapper.get("[data-testid='permalink-qr-url']").text()).toBe(openDppPermalink.publicUrl);
    await wrapper.get("[data-testid='permalink-qr-copy-btn']").trigger("click");
    await flushPromises();

    expect(copy).toHaveBeenCalledWith(openDppPermalink.publicUrl);
    expect(addSuccessNotification).toHaveBeenCalledWith("Copied");
  });

  it("shows the GS1 element string next to a GS1 Digital Link", async () => {
    const wrapper = mountDataCarrier({
      permalink: {
        ...openDppPermalink,
        kind: "gs1-link",
        publicUrl: "https://cloud.open-dpp.de/01/09501101020917/21/SER-1",
      },
      identity: { gtin: "09501101020917", serial: "SER-1" },
    });
    await flushPromises();

    expect(wrapper.get("[data-testid='permalink-qr-element-string']").text()).toBe(
      "(01) 09501101020917 (21) SER-1",
    );
    expect(wrapper.text()).toContain("GS1 Digital Link");
  });
});
