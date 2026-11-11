import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";

const { getCarrierExport, downloadBlob, logErrorWithNotification, addSuccessNotification } =
  vi.hoisted(() => ({
    getCarrierExport: vi.fn(),
    downloadBlob: vi.fn(),
    logErrorWithNotification: vi.fn(),
    addSuccessNotification: vi.fn(),
  }));

vi.mock("../../lib/api-client", () => ({
  default: { dpp: { permalinks: { getCarrierExport } } },
}));
vi.mock("../../lib/download", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/download")>()),
  downloadBlob,
}));
vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification }),
}));
vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification }),
}));

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
        copyError: "The link could not be copied.",
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

// Rendering and wiring only: the loading, download and copy logic is covered by
// composables/data-carrier.spec.ts
describe("DataCarrier", () => {
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();
  const writeText = vi.fn();

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
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });

  it("shows the server-rendered SVG of the permalink", async () => {
    const wrapper = mountDataCarrier();
    await flushPromises();

    expect(getCarrierExport).toHaveBeenCalledWith(openDppPermalink.id, { format: "svg" });
    const image = wrapper.get("[data-testid='data-carrier-image']");
    expect(image.attributes("src")).toBe("blob:carrier-1");
    expect(image.attributes("alt")).toBe(`Data carrier for ${openDppPermalink.publicUrl}`);
  });

  it("releases the SVG when it unmounts", async () => {
    const wrapper = mountDataCarrier();
    await flushPromises();

    wrapper.unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:carrier-1");
  });

  it("tells the user when the SVG cannot be loaded", async () => {
    getCarrierExport.mockRejectedValueOnce(new Error("network"));

    const wrapper = mountDataCarrier();
    await flushPromises();

    expect(wrapper.find("[data-testid='data-carrier-image']").exists()).toBe(false);
    expect(wrapper.get("[data-testid='data-carrier-load-error']").text()).toBe(
      "The data carrier could not be loaded.",
    );
  });

  it.each([
    ["svg", "data-carrier-download-svg"],
    ["png", "data-carrier-download-png"],
  ])("downloads the %s from its button", async (format, testId) => {
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

  it("disables both download buttons while a download runs", async () => {
    const wrapper = mountDataCarrier();
    await flushPromises();
    getCarrierExport.mockImplementationOnce(() => new Promise(() => {}));

    await wrapper.get("[data-testid='data-carrier-download-png']").trigger("click");

    for (const testId of ["data-carrier-download-svg", "data-carrier-download-png"]) {
      expect(wrapper.get(`[data-testid='${testId}']`).attributes()).toHaveProperty("disabled");
    }
  });

  it("shows and copies the public URL", async () => {
    const wrapper = mountDataCarrier();
    await flushPromises();

    expect(wrapper.text()).toContain("Public URL");
    expect(wrapper.get("[data-testid='data-carrier-url']").text()).toBe(openDppPermalink.publicUrl);
    expect(wrapper.find("[data-testid='data-carrier-element-string']").exists()).toBe(false);
    await wrapper.get("[data-testid='data-carrier-copy-btn']").trigger("click");
    await flushPromises();

    expect(writeText).toHaveBeenCalledWith(openDppPermalink.publicUrl);
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

    expect(wrapper.get("[data-testid='data-carrier-element-string']").text()).toBe(
      "(01) 09501101020917 (21) SER-1",
    );
    expect(wrapper.text()).toContain("GS1 Digital Link");
  });
});
