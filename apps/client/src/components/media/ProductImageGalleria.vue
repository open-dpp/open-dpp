<script setup lang="ts">
import type { MediaFileCollectionItem } from "../../composables/media-file.ts";
import Galleria from "primevue/galleria";
import Image from "primevue/image";
import { computed } from "vue";
import emptyState from "../../assets/empty-state.png";

const props = defineProps<{ autoPlay?: boolean; size?: number; withBorder?: boolean }>();
const model = defineModel<MediaFileCollectionItem[]>();

const productImagesExist = computed<boolean>(
  () => model.value !== undefined && model.value.length > 0,
);
const size = props.size ?? 340;
</script>

<template>
  <Galleria
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
        <Image
          :src="slotProps.item.url"
          alt="Image"
          :pt="{
            image: {
              style: `max-height: ${size}px; max-width: 100%; object-fit: contain;`,
            },
          }"
        />
      </div>
    </template>
  </Galleria>
</template>
