<script lang="ts" setup>
import type { MediaInfo } from "./MediaInfo.interface";
import { computed, onMounted } from "vue";
import { useMediaStore } from "../../stores/media";
import Pagination from "../lists/Pagination.vue";
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

const page = computed(() => {
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
  <div>
    <div class="overflow-y-auto p-3">
      <ul class="flex flex-wrap gap-x-4 gap-y-8 h-[50vh]" role="list">
        <li v-for="media in page" :key="media.id" class="relative">
          <MediaListItem
            :data-cy="`select-media-${media.id}`"
            :is-selected="selected.some((f) => f.id === media.id)"
            :media="media"
            :selectable="selectable"
            @on-select="onSelect"
          />
        </li>
      </ul>
    </div>
    <div>
      <Pagination
        :current-page="0"
        :items-per-page="page.length"
        :total-items="page.length"
      />
    </div>
  </div>
</template>
