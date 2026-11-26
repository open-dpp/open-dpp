import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import MediaListItem from "./MediaListItem.vue";

// The preview is stubbed, so the tile makes no request
vi.mock("../../lib/api-client", () => ({ default: {} }));

const TITLE = "logo.svg";

/** The lines of text below the preview of the tile. */
function shownLines(size: number, locale = "en-US") {
  const wrapper = mount(MediaListItem, {
    props: { media: { id: "media-id", title: TITLE, mimeType: "image/svg+xml", size } },
    global: {
      plugins: [createI18n({ legacy: false, locale })],
      stubs: { MediaPreview: true },
    },
  });
  return wrapper.findAll("p").map((line) => line.text());
}

describe("MediaListItem", () => {
  it.each([
    { size: 209, text: "209 B" },
    { size: 34_000, text: "33.2 KB" },
    { size: 1_572_864, text: "1.5 MB" },
    { size: 15_728_640, text: "15 MB" },
  ])("shows a file of $size bytes as $text below its title", ({ size, text }) => {
    expect(shownLines(size)).toEqual([TITLE, text]);
  });

  it("shows the file size with the decimal separator of the active language", () => {
    expect(shownLines(34_000, "de-DE")).toEqual([TITLE, "33,2 KB"]);
  });
});
