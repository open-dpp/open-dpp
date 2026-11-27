import type { PagingParamsDto } from "@open-dpp/dto";
import type { VueWrapper } from "@vue/test-utils";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Button from "primevue/button";
import PrimeVue from "primevue/config";
import DataView from "primevue/dataview";
import Tooltip from "primevue/tooltip";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import { useMediaStore } from "../../stores/media";
import { useNotificationStore } from "../../stores/notification";
import {
  eightMediaOnTwoPages,
  FIRST_PAGE,
  mediaFile,
  newestSixMedia,
  type ServedMediaPages,
  servedMediaPage,
} from "../../testing-utils/fixtures/organization-media";
import enUS from "../../translations/en-US.json";
import MediaGrid from "./MediaGrid.vue";

const mocks = vi.hoisted(() => ({
  getMediaInfoByOrganization: vi.fn(),
  download: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: { media: { media: mocks } },
}));

/** Answers the list endpoint per cursor, like the backend. */
function serveOrganizationMedia(pages: ServedMediaPages, total: number) {
  mocks.getMediaInfoByOrganization.mockImplementation(async (params?: PagingParamsDto) => ({
    data: servedMediaPage(pages, total, params?.cursor),
  }));
}

let pinia: ReturnType<typeof createPinia>;

async function mountGrid() {
  const wrapper = mount(MediaGrid, {
    props: { selectable: true, multiple: false, selected: [] },
    global: {
      plugins: [
        pinia,
        PrimeVue,
        createI18n({ legacy: false, locale: "en-US", messages: { "en-US": enUS } }),
      ],
      components: { DataView, Button },
      directives: { tooltip: Tooltip },
      stubs: { Image: true },
    },
  });
  await flushPromises();
  return wrapper;
}

function shownTitles(wrapper: VueWrapper) {
  return wrapper.findAll("[data-testid='media-list-item']").map((item) => item.find("p").text());
}

/** Clicks a button of the bar below the grid, found by its accessible name. */
async function clickBarButton(wrapper: VueWrapper, name: "Previous page" | "Next page") {
  await wrapper.find(`button[aria-label="${name}"]`).trigger("click");
  await flushPromises();
}

describe("MediaGrid", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    pinia = createPinia();
    setActivePinia(pinia);
    mocks.download.mockResolvedValue({ status: 200, data: new Blob(["file"]) });
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  it("requests one page of six files when it opens and shows them with their position", async () => {
    serveOrganizationMedia({ [FIRST_PAGE]: { result: newestSixMedia, next: "after-c" } }, 8);

    const wrapper = await mountGrid();

    expect(mocks.getMediaInfoByOrganization.mock.calls).toEqual([[{ limit: 6 }]]);
    expect(shownTitles(wrapper)).toEqual(["h.png", "g.png", "f.png", "e.png", "d.png", "c.png"]);
    expect(wrapper.text()).toContain("Showing: 1 - 6 of 8");
  });

  it("shows the next and the previous page from the bar below the grid", async () => {
    serveOrganizationMedia(eightMediaOnTwoPages, 8);
    const wrapper = await mountGrid();

    await clickBarButton(wrapper, "Next page");

    expect(shownTitles(wrapper)).toEqual(["b.png", "a.png"]);
    expect(wrapper.text()).toContain("Showing: 7 - 8 of 8");

    await clickBarButton(wrapper, "Previous page");

    expect(shownTitles(wrapper)).toEqual(["h.png", "g.png", "f.png", "e.png", "d.png", "c.png"]);
    expect(wrapper.text()).toContain("Showing: 1 - 6 of 8");
  });

  it("requests the file of a preview once, also when the page is loaded again", async () => {
    serveOrganizationMedia({ [FIRST_PAGE]: { result: newestSixMedia, next: "after-c" } }, 8);
    const wrapper = await mountGrid();
    // "g" was deleted, so "b" moves up from the next page
    const withoutG = ["h", "f", "e", "d", "c", "b"].map(mediaFile);
    serveOrganizationMedia({ [FIRST_PAGE]: { result: withoutG, next: "after-b" } }, 7);

    await useMediaStore().reloadOrganizationMediaPage();
    await flushPromises();

    expect(shownTitles(wrapper)).toEqual(["h.png", "f.png", "e.png", "d.png", "c.png", "b.png"]);
    expect(mocks.download.mock.calls.map(([id]) => id)).toEqual([
      "h",
      "g",
      "f",
      "e",
      "d",
      "c",
      "b",
    ]);
  });

  it("tells the user when a page cannot be loaded", async () => {
    mocks.getMediaInfoByOrganization.mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await mountGrid();

    expect(useNotificationStore().notifications.map(({ message }) => message)).toEqual([
      "Failed to load media",
    ]);
  });
});
