<script lang="ts" setup>
import type { MediaInfo } from "./MediaInfo.interface";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { CloudArrowUpIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useIndexStore } from "../../stores";
import { useMediaStore } from "../../stores/media";
import { useNotificationStore } from "../../stores/notification";
import MediaGrid from "./MediaGrid.vue";

const props = defineProps<{
  open: boolean;
}>();
const emits = defineEmits<{
  (e: "confirm", files: Array<MediaInfo>): void;
  (e: "cancel"): void;
}>();
const { t } = useI18n();
const mediaStore = useMediaStore();
const notificationStore = useNotificationStore();
const indexStore = useIndexStore();

const selected = ref<Array<MediaInfo>>([]);
const fileInput = ref<HTMLInputElement>();
const selectedLocalFile = ref<File | null>(null);
const selectedFile = ref<MediaInfo | null>(null);
const uploadProgress = ref<number>(0);

async function uploadFile() {
  const organizationId = indexStore.selectedOrganization;
  if (!selectedLocalFile.value || !organizationId) {
    return;
  }
  try {
    await mediaStore.uploadMedia(
      organizationId,
      selectedLocalFile.value,
      progress => (uploadProgress.value = progress),
    );
    notificationStore.addSuccessNotification("Datei erfolgreich hochgeladen.");
    await mediaStore.fetchMediaByOrganizationId();
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

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      selected.value = [];
      selectedFile.value = null;
      uploadProgress.value = 0;
    }
  },
);
</script>

<template>
  <TransitionRoot :show="props.open" as="oldTemplate">
    <Dialog class="relative z-50" @close="emits('cancel')">
      <TransitionChild
        as="oldTemplate"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 max-w-[80%] mx-auto overflow-y-auto">
        <div
          class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
        >
          <TransitionChild
            as="oldTemplate"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:p-6"
            >
              <div class="sm:flex justify-between pb-5">
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <DialogTitle
                    as="h3"
                    class="text-base font-semibold text-gray-900"
                  >
                    {{ t('file.select') }}
                  </DialogTitle>
                </div>
                <div>
                  <button
                    class="rounded-full p-2 hover:cursor-pointer hover:shadow-sm"
                    @click="emits('cancel')"
                  >
                    <XMarkIcon class="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div class="flex justify-end">
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
                <button
                  class="p-2 bg-[#6BAD87]/20 rounded-full hover:cursor-pointer"
                  @click="openFileInput"
                >
                  <CloudArrowUpIcon class="w-5 h-5 text-black" />
                </button>
              </div>
              <div
                class="px-4 py-2 sm:px-6 sm:py-4 max-h-[50vh] overflow-y-auto"
              >
                <MediaGrid
                  :multiple="false"
                  :selected="selected"
                  selectable
                  @update-selected-items="(items) => (selected = items)"
                />
              </div>
              <div class="mt-5 sm:mt-4 flex flex-row gap-2 justify-end">
                <button
                  :disabled="selected.length === 0"
                  class="bg-[#6BAD87] p-2 rounded text-white hover:cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                  type="button"
                  @click="emits('confirm', selected)"
                >
                  {{ t('common.select') }}
                </button>
                <button
                  class="bg-[#6BAD87]/20 p-2 rounded text-[#6BAD87]/80 hover:cursor-pointer"
                  type="button"
                  @click="emits('cancel')"
                >
                  {{ t('common.abort') }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
