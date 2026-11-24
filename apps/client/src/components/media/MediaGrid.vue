<script lang="ts" setup>
import type { MediaInfo } from "./MediaInfo.interface";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { ORGANIZATION_MEDIA_PAGE_SIZE, useMediaStore } from "../../stores/media";
import TablePagination from "../pagination/TablePagination.vue";
import MediaListItem from "./MediaListItem.vue";

const props = defineProps<{
  selectable: boolean;
  multiple: boolean;
  selected: Array<MediaInfo>;
}>();
const emits = defineEmits<{
  (e: "updateSelectedItems", items: Array<MediaInfo>): void;
}>();
const { t } = useI18n();
const mediaStore = useMediaStore();
const errorHandlingStore = useErrorHandlingStore();
const {
  organizationMedia,
  organizationMediaPage,
  organizationMediaTotal,
  hasNextOrganizationMediaPage,
  hasPreviousOrganizationMediaPage,
} = storeToRefs(mediaStore);

function onSelect(media: MediaInfo) {
  if (props.selected.some((f) => f.id === media.id)) {
    emits(
      "updateSelectedItems",
      props.selected.filter((f) => f.id !== media.id),
    );
  } else {
    if (props.multiple) {
      emits("updateSelectedItems", props.selected.concat(media));
    } else {
      emits("updateSelectedItems", [media]);
    }
  }
}

/** Loads a page of the media and tells the user when that fails. */
async function loadOrNotify(loadPage: () => Promise<unknown>) {
  try {
    await loadPage();
  } catch (error: unknown) {
    errorHandlingStore.logErrorWithNotification(t("media.loadFailure"), error);
  }
}

onMounted(() => loadOrNotify(mediaStore.openOrganizationMedia));
</script>

<template>
  <DataView :value="organizationMedia" layout="grid" paginator :rows="ORGANIZATION_MEDIA_PAGE_SIZE">
    <template #grid="slotProps">
      <div class="grid grid-cols-12 gap-4">
        <div
          v-for="item in slotProps.items"
          :key="item.id"
          class="col-span-12 p-2 lg:col-span-6 xl:col-span-4 2xl:col-span-3"
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
    <template #paginatorcontainer>
      <TablePagination
        :current-page="organizationMediaPage"
        :has-previous="hasPreviousOrganizationMediaPage"
        :has-next="hasNextOrganizationMediaPage"
        :total-count="organizationMediaTotal"
        @reset-cursor="loadOrNotify(mediaStore.showFirstOrganizationMediaPage)"
        @previous-page="loadOrNotify(mediaStore.showPreviousOrganizationMediaPage)"
        @next-page="loadOrNotify(mediaStore.showNextOrganizationMediaPage)"
      />
    </template>
  </DataView>
</template>
