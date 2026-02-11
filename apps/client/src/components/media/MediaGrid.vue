<script lang="ts" setup>
import type { MediaInfo } from "./MediaInfo.interface";
import { DataView } from "primevue";
import { computed, onMounted } from "vue";
import { useMediaStore } from "../../stores/media";
import MediaListItem from "./MediaListItem.vue";

const props = defineProps<{
  selectable: boolean;
  multiple: boolean;
  selected: Array<MediaInfo>;
}>();
const emits = defineEmits<{
  (e: "updateSelectedItems", items: Array<MediaInfo>): void;
}>();
const mediaStore = useMediaStore();

const mediaFiles = computed(() => {
  return mediaStore.organizationMedia;
});

function onSelect(media: MediaInfo) {
  if (props.selected.some(f => f.id === media.id)) {
    emits(
      "updateSelectedItems",
      props.selected.filter(f => f.id !== media.id),
    );
  }
  else {
    if (props.multiple) {
      emits("updateSelectedItems", props.selected.concat(media));
    }
    else {
      emits("updateSelectedItems", [media]);
    }
  }
}

onMounted(async () => {
  await mediaStore.fetchMediaByOrganizationId();
});
</script>

<template>
  <DataView :value="mediaFiles" layout="grid" paginator :rows="6">
    <template #grid="slotProps">
      <div class="grid grid-cols-12 gap-4">
        <div
          v-for="(item) in slotProps.items"
          :key="item.id"
          class="col-span-12 lg:col-span-6 xl:col-span-4 2xl:col-span-3 p-2"
        >
          <MediaListItem
            :data-cy="`select-media-${item.id}`"
            :is-selected="selected.some((f) => f.id === item.id)"
            :media="item"
            :selectable="selectable"
            @on-select="onSelect"
          />
        </div>
      </div>
    </template>
  </DataView>
</template>
