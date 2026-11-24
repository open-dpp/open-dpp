<script setup lang="ts">
import type { MediaFileCollectionItem } from "../../composables/media-file.ts";
import Galleria from "primevue/galleria";
import Image from "primevue/image";
import { computed, ref } from "vue";
import emptyState from "../../assets/empty-state.png";
import { useI18n } from "vue-i18n";

const props = defineProps<{ autoPlay?: boolean; size?: number; withBorder?: boolean }>();
const model = defineModel<MediaFileCollectionItem[]>();
const { t } = useI18n();

const productImagesExist = computed<boolean>(
  () => model.value !== undefined && model.value.length > 0,
);
const size = props.size ?? 340;

/** The position the viewer last moved to. The list can since have become shorter than that. */
const chosenIndex = ref(0);
/** Without product images the gallery shows one slide, the placeholder. */
const lastIndex = computed(() => Math.max((model.value?.length ?? 0) - 1, 0));
/**
 * Galleria keeps its position when its list gets shorter and then has no item for its slide.
 * That happens on every reload of the product images, which empties the list before it fills it
 * again. So the position comes from here and never points behind the list. The chosen position
 * is kept, so the gallery is back on it once the list is long enough again.
 */
const activeIndex = computed({
  get: () => Math.min(chosenIndex.value, lastIndex.value),
  set: (index: number) => {
    chosenIndex.value = index;
  },
});
</script>

<template>
  <Galleria
    v-model:active-index="activeIndex"
    :value="productImagesExist ? model : [{ url: emptyState }]"
    :num-visible="productImagesExist ? 3 : 0"
    :show-thumbnails="false"
    thumbnails-position="bottom"
    :auto-play="productImagesExist && props.autoPlay"
    :show-item-navigators="productImagesExist"
    :transition-interval="2000"
    :circular="productImagesExist"
    class="w-full"
    :container-style="`max-width: 100%; height: ${size + 60}px; ${withBorder ? 'padding: 5px;' : 'border: none !important;'}`"
    :show-item-navigators-on-hover="productImagesExist"
    :show-indicators="productImagesExist"
  >
    <template #item="slotProps">
      <div class="flex w-full items-center justify-center" :style="`height: ${size}px;`">
        <!-- The image box has the size of the slide, so an SVG with only a viewBox, which has no
             size of its own, fills it instead of collapsing. Photos keep their own size. -->
        <Image
          v-if="!slotProps.item.deleted"
          class="flex h-full w-full items-center justify-center"
          image-class="max-h-full max-w-full object-contain"
          :src="slotProps.item.url"
          alt="Image"
        />
        <div v-else class="text-red-600">{{ t("media.deletedFile") }}</div>
      </div>
    </template>
  </Galleria>
</template>
