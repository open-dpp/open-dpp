import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import ConfirmationService from "primevue/confirmationservice";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";
import deDE from "../../translations/de-DE.json";
import enUS from "../../translations/en-US.json";
import MediaDetailsSidebar from "./MediaDetailsSidebar.vue";

// The preview is stubbed, so the panel makes no request
vi.mock("../../lib/api-client", () => ({ default: {} }));

type Locale = "en-US" | "de-DE";

const FILE_SIZE_LABEL: Record<Locale, string> = {
  "en-US": enUS.file.size,
  "de-DE": deDE.file.size,
};

// PrimeVue's Drawer renders its content outside of the mounted component. The stub keeps it in place.
const DrawerStub = defineComponent({
  props: ["visible"],
  setup:
    (props, { slots }) =>
    () =>
      props.visible ? h("div", slots.default?.()) : null,
});

/** The value the panel shows next to its "File size" label. */
function shownFileSize(size: number, locale: Locale = "en-US") {
  const wrapper = mount(MediaDetailsSidebar, {
    props: {
      modelValue: true,
      media: { id: "media-id", title: "logo.svg", mimeType: "image/svg+xml", size },
    },
    global: {
      plugins: [
        createPinia(),
        createI18n({ legacy: false, locale, messages: { "en-US": enUS, "de-DE": deDE } }),
        ConfirmationService,
      ],
      stubs: { Drawer: DrawerStub, MediaPreview: true, Button: true },
    },
  });
  const label = wrapper.findAll("dt").find((term) => term.text() === FILE_SIZE_LABEL[locale]);
  return label?.element.nextElementSibling?.textContent?.trim();
}

describe("MediaDetailsSidebar", () => {
  it.each([
    { size: 209, text: "209 B" },
    { size: 34_000, text: "33.2 KB" },
    { size: 1_572_864, text: "1.5 MB" },
    { size: 15_728_640, text: "15 MB" },
  ])("shows a file of $size bytes as $text", ({ size, text }) => {
    expect(shownFileSize(size)).toBe(text);
  });

  it("shows the file size with the decimal separator of the active language", () => {
    expect(shownFileSize(34_000, "de-DE")).toBe("33,2 KB");
  });
});
