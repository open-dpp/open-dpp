<template>
  <div>
    <div class="overflow-y-auto p-3">
      <ul class="flex flex-wrap gap-x-4 gap-y-8" role="list">
        <li v-for="media in page" :key="media.id" class="relative">
          <MediaListItem
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

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import Pagination from '../lists/Pagination.vue';
import { useMediaStore } from '../../stores/media';
import { useIndexStore } from '../../stores';
import { MediaInfo } from './MediaInfo.interface';
import MediaListItem from './MediaListItem.vue';

const mediaStore = useMediaStore();
const indexStore = useIndexStore();

const props = defineProps<{
  selectable: boolean;
  multiple: boolean;
  selected: Array<MediaInfo>;
}>();

const emits = defineEmits<{
  (e: 'update-selected-items', items: Array<MediaInfo>): void;
}>();

const page = computed(() => {
  return mediaStore.organizationMedia;
});

const onSelect = (media: MediaInfo) => {
  if (props.selected.some((f) => f.id === media.id)) {
    emits(
      'update-selected-items',
      props.selected.filter((f) => f.id !== media.id),
    );
  } else {
    if (props.multiple) {
      emits('update-selected-items', props.selected.concat(media));
    } else {
      emits('update-selected-items', [media]);
    }
  }
};

onMounted(async () => {
  if (indexStore.selectedOrganization) {
    await mediaStore.fetchMediaByOrganizationId(
      indexStore.selectedOrganization,
    );
  }
});
</script>
