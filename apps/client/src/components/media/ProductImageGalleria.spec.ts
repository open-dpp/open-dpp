import { mount, type VueWrapper } from "@vue/test-utils";
import PrimeVue from "primevue/config";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";
import emptyState from "../../assets/empty-state.png";
import type { MediaFileCollectionItem } from "../../composables/media-file.ts";
import ProductImageGalleria from "./ProductImageGalleria.vue";

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: { en: { media: { deletedFile: "Deleted file" } } },
});

/** How long the gallery stays on an image with autoplay. */
const SLIDE_INTERVAL_MS = 2000;

function image(name: string): MediaFileCollectionItem {
  return {
    blob: null,
    deleted: false,
    url: `blob:${name}`,
    mediaInfo: { id: name, mimeType: "image/webp", size: 1, title: name },
  };
}

/** The gallery on a list that changes the way the media collection changes it. */
function mountGallery(initial: MediaFileCollectionItem[], props: { autoPlay?: boolean } = {}) {
  const images = ref(initial);
  const wrapper = mount(
    defineComponent({
      setup: () => () => h(ProductImageGalleria, { ...props, modelValue: images.value }),
    }),
    { global: { plugins: [PrimeVue, i18n] } },
  );
  return { images, wrapper };
}

function positionMarkers(wrapper: VueWrapper) {
  return wrapper.findAll("li");
}

function shownImage(wrapper: VueWrapper) {
  return wrapper.find("img").attributes("src");
}

function shownPosition(wrapper: VueWrapper) {
  return positionMarkers(wrapper).findIndex(
    (marker) => marker.attributes("aria-selected") === "true",
  );
}

async function show(wrapper: VueWrapper, index: number) {
  await positionMarkers(wrapper)[index]!.trigger("click");
}

describe("ProductImageGalleria", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the image at the same position after the list was emptied and filled again", async () => {
    const { images, wrapper } = mountGallery([image("a"), image("b"), image("c")]);
    await show(wrapper, 2);
    expect(shownImage(wrapper)).toBe("blob:c");

    // the reload after a save: the collection drops every image, then adds them one by one
    images.value = [];
    await nextTick();
    expect(shownImage(wrapper)).toBe(emptyState);
    expect(positionMarkers(wrapper)).toHaveLength(0);

    for (const reloaded of [image("a"), image("b"), image("d")]) {
      images.value.push(reloaded);
      await nextTick();
    }

    expect(shownImage(wrapper)).toBe("blob:d");
    expect(positionMarkers(wrapper)).toHaveLength(3);
    expect(shownPosition(wrapper)).toBe(2);
  });

  it("shows the last image when the position it showed no longer exists", async () => {
    const { images, wrapper } = mountGallery([image("a"), image("b"), image("c")]);
    await show(wrapper, 2);

    images.value = [image("a"), image("b")];
    await nextTick();

    expect(shownImage(wrapper)).toBe("blob:b");
    expect(positionMarkers(wrapper)).toHaveLength(2);
    expect(shownPosition(wrapper)).toBe(1);
  });

  it("goes back to a position the viewer picks after the list became shorter", async () => {
    const { images, wrapper } = mountGallery([image("a"), image("b"), image("c")]);
    await show(wrapper, 2);
    images.value = [image("a"), image("b")];
    await nextTick();

    await show(wrapper, 0);

    expect(shownImage(wrapper)).toBe("blob:a");
    expect(shownPosition(wrapper)).toBe(0);
  });

  it("moves through the images by itself and starts over after the last with autoplay", async () => {
    vi.useFakeTimers();
    const { wrapper } = mountGallery([image("a"), image("b")], { autoPlay: true });
    expect(shownImage(wrapper)).toBe("blob:a");

    await vi.advanceTimersByTimeAsync(SLIDE_INTERVAL_MS);
    expect(shownImage(wrapper)).toBe("blob:b");

    await vi.advanceTimersByTimeAsync(SLIDE_INTERVAL_MS);
    expect(shownImage(wrapper)).toBe("blob:a");
  });
});
