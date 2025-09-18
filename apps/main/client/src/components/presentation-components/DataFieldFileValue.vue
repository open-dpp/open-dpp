<template>
  <div v-if="uploadedMedia" class="max-w-full flex flex-col gap-4">
    <div class="flex flex-row gap-4 w-full justify-between">
      <MediaPreview :media="uploadedMedia" class="grow" />
      <a
        v-if="uploadedFileUrl"
        :download="uploadedMedia.title"
        :href="uploadedFileUrl"
        class="shrink bg-[#6BAD87]/50 rounded-sm p-2 hover:cursor-pointer my-auto"
      >
        <ArrowDownTrayIcon class="h-4 w-4" />
      </a>
    </div>
    <div class="text-gray-600 text-sm my-auto max-w-full truncate">
      {{ uploadedMedia.title }}
    </div>
  </div>
  <div v-else class="flex flex-row gap-4">
    Datei konnte nicht geladen werden.
  </div>
</template>

<script setup lang="ts">
import { FieldView } from "../../lib/field-view";
import { onMounted, ref } from "vue";
import { ArrowDownTrayIcon } from "@heroicons/vue/24/outline";
import { useMediaStore } from "../../stores/media";
import { MediaInfo } from "../media/MediaInfo.interface";
import MediaPreview from "../media/MediaPreview.vue";

const mediaStore = useMediaStore();

const props = defineProps<{ fieldView: FieldView }>();

const uploadedFileUrl = ref<string | undefined>(undefined);
const uploadedMedia = ref<MediaInfo | null>(null);

const loadFile = async () => {
  try {
    const { blob, mediaInfo } = await mediaStore.fetchMedia(
      props.fieldView.value as string,
    );

    // Revoke an old object URL to avoid memory leaks before assigning a new one
    if (uploadedFileUrl.value) {
      try {
        URL.revokeObjectURL(uploadedFileUrl.value);
      } catch (revokeErr) {
        console.error(
          "Fehler beim Freigeben der vorherigen Objekt-URL:",
          revokeErr,
        );
      }
    }

    if (blob) {
      uploadedFileUrl.value = URL.createObjectURL(blob);
    }
    uploadedMedia.value = mediaInfo;
  } catch (error) {
    console.error("Fehler beim Laden der Datei:", error);
    // Reset state on failure
    if (uploadedFileUrl.value) {
      try {
        URL.revokeObjectURL(uploadedFileUrl.value);
      } catch (revokeErr) {
        console.error(
          "Fehler beim Freigeben der Objekt-URL nach Fehler:",
          revokeErr,
        );
      }
    }
    uploadedFileUrl.value = undefined;
    uploadedMedia.value = null;

    // Notify user via the existing notification store if available
    try {
      /* notificationStore.addErrorNotification(
          "Die Datei konnte nicht geladen werden. Bitte versuchen Sie es erneut.",
      ); */
    } catch {
      // Fallback to console if the notification store is not available for any reason
      console.error(
        "Benachrichtigung über Ladefehler konnte nicht angezeigt werden.",
      );
    }
    // We intentionally do not rethrow to keep caller logic simple unless needed.
  }
};

onMounted(async () => {
  await loadFile();
});
</script>
