<script lang="ts" setup>
import type { MediaInfo } from "./MediaInfo.interface";
import { useI18n } from "vue-i18n";
import MediaPreview from "./MediaPreview.vue";
import { useMediaStore } from "../../stores/media";
import { useConfirm } from "primevue";
import { useNotificationStore } from "../../stores/notification";

const { media } = defineProps<{
  media?: MediaInfo;
}>();

const open = defineModel<boolean>({ required: true });

const { t } = useI18n();
const { deleteMedia, fetchMediaByOrganizationId } = useMediaStore();
const notificationStore = useNotificationStore();
const confirm = useConfirm();

const deleteFile = async () => {
  confirm.require({
    header: t("media.deleteDialog.header"),
    message: t("media.deleteDialog.message"),
    acceptProps: {
      label: t("file.delete"),
      severity: "danger",
    },
    rejectProps: {
      label: t("common.cancel"),
      severity: "secondary",
    },
    accept: async () => {
      if (media) {
        await deleteMedia(media.id);
        await fetchMediaByOrganizationId();
        notificationStore.addSuccessNotification(t("media.deleteSuccess"));
        open.value = false;
      }
    },
  });
};
</script>

<template>
  <Drawer id="media-sidebar" v-model:visible="open" position="right" header="Details">
    <dl v-if="media" class="flex flex-col gap-4">
      <div class="flex-auto">
        <dt class="font-semibold text-gray-900 dark:text-gray-100">
          {{ t("common.id") }}
        </dt>
        <dd class="mt-1 text-sm/6 text-gray-900 dark:text-white">
          {{ media.id }}
        </dd>
      </div>
      <div class="flex-auto">
        <dt class="font-semibold text-gray-900 dark:text-gray-100">
          {{ t("media.preview") }}
        </dt>
        <dd class="mt-1 text-sm/6 text-gray-900 dark:text-white">
          <MediaPreview :key="media.id" :media="media" :preview="true" class="h-64 w-full" />
        </dd>
      </div>
      <div class="flex-auto">
        <dt class="font-semibold text-gray-900 dark:text-gray-100">
          {{ t("file.type") }}
        </dt>
        <dd class="mt-1 text-sm/6 text-gray-900 dark:text-white">
          {{ media.mimeType }}
        </dd>
      </div>
      <div class="flex-auto">
        <dt class="font-semibold text-gray-900 dark:text-gray-100">
          {{ t("file.size") }}
        </dt>
        <dd class="mt-1 text-sm/6 text-gray-900 dark:text-white">
          {{ (media.size / 1024 / 1024).toFixed(1) }} MB
        </dd>
      </div>
      <div class="flex-auto">
        <dt class="font-semibold text-gray-900 dark:text-gray-100">
          {{ t("file.actions") }}
        </dt>
        <dd class="mt-1 text-sm/6 text-gray-900 dark:text-white">
          <Button severity="danger" @click="deleteFile()">{{ t("file.delete") }}</Button>
        </dd>
      </div>
    </dl>
  </Drawer>
</template>
