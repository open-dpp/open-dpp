<script lang="ts" setup>
import type { MediaInfo } from "../../components/media/MediaInfo.interface";
import { CloudArrowUpIcon } from "@heroicons/vue/24/outline";
import { ref } from "vue";
import MediaDetailsSidebar from "../../components/media/MediaDetailsSidebar.vue";
import MediaGrid from "../../components/media/MediaGrid.vue";
import { useIndexStore } from "../../stores";
import { useMediaStore } from "../../stores/media";
import { useNotificationStore } from "../../stores/notification";

const mediaStore = useMediaStore();
const notificationStore = useNotificationStore();
const indexStore = useIndexStore();

const selected = ref<Array<MediaInfo>>([]);
const sidebarOpen = ref<boolean>(false);
const fileInput = ref<HTMLInputElement>();
const selectedLocalFile = ref<File | null>(null);
const selectedFile = ref<MediaInfo | null>(null);
const uploadProgress = ref<number>(0);

function updateSelected(items: Array<MediaInfo>) {
  selected.value = items;
  sidebarOpen.value = items.length === 1;
}

async function uploadFile() {
  if (!selectedLocalFile.value || !indexStore.selectedOrganization) {
    return;
  }
  try {
    const mediaId = await mediaStore.uploadMedia(
      indexStore.selectedOrganization,
      selectedLocalFile.value,
      progress => (uploadProgress.value = progress),
    );
    notificationStore.addSuccessNotification("Datei erfolgreich hochgeladen.");
    await mediaStore.fetchMedia(mediaId);
  }
  catch (error: unknown) {
    console.error("Fehler beim Hochladen der Datei:", error);
    notificationStore.addErrorNotification(
      "Beim Hochladen der Datei ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.",
    );
    selectedFile.value = null;
  }
  finally {
    uploadProgress.value = 0;
  }
}

function openFileInput() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

async function selectFile(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedLocalFile.value = target.files[0] as File;
    await uploadFile();
  }
  else {
    selectedLocalFile.value = null;
  }
}
</script>

<template>
  <div class="flex flex-row gap-3 h-full w-full">
    <form>
      <input
        v-show="false"
        ref="fileInput"
        class="cursor-pointer select-none py-1.5 text-gray-900 placeholder:text-gray-400 sm:text-sm sm:leading-6"
        readonly
        type="file"
        @change="selectFile"
      >
    </form>
    <div class="mt-8 flex flex-col gap-10 grow">
      <div class="flex justify-end">
        <button
          class="flex flex-row gap-2 p-3 bg-[#6BAD87]/20 rounded-full hover:cursor-pointer"
          @click="openFileInput"
        >
          <CloudArrowUpIcon class="w-5 h-5 my-auto text-black" />
          <span>Datei hochladen</span>
        </button>
      </div>
      <div>
        <MediaGrid
          :multiple="false"
          :selectable="true"
          :selected="selected"
          @update-selected-items="updateSelected"
        />
      </div>
    </div>
    <div
      v-if="sidebarOpen"
      class="flex flex-col gap-4 w-sm shadow-sm p-4 h-full shrink"
    >
      <MediaDetailsSidebar v-if="selected.length > 0" :media="selected[0] as MediaInfo" @close="sidebarOpen = false" />
    </div>
  </div>
</template>
