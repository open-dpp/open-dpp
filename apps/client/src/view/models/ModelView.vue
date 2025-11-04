<script lang="ts" setup>
import type { MediaInfo } from "../../components/media/MediaInfo.interface.ts";
import { Button, Galleria, Image } from "primevue";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import emptyState from "../../assets/empty-state.png";
import GalleriaEditDialog from "../../components/models/GalleriaEditDialog.vue";
import PassportForm from "../../components/passport/PassportForm.vue";
import { usePassportFormStore } from "../../stores/passport.form";

const { t } = useI18n();
const route = useRoute();
const modelFormStore = usePassportFormStore();
const galleriaEditDialogIsVisible = ref(false);

watch(
  () => route.params.modelId, // The store property to watch
  async () => {
    await modelFormStore.fetchModel(String(route.params.modelId));
    await modelFormStore.loadMedia();
  },
  { immediate: true, deep: true }, // Optional: to run the watcher immediately when the component mounts
);

async function addMedia(images: MediaInfo[]) {
  if (images.length > 0 && images[0]) {
    await modelFormStore.addMediaReference(images[0]);
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col pt-4 gap-3">
      <div class="flex gap-3">
        <div class="flex-1 overflow-hidden bg-white shadow-sm sm:rounded-lg">
          <div class="px-4 py-6 sm:px-6">
            <h3 class="text-base/7 font-semibold text-gray-900">
              {{ t('models.info') }}
            </h3>
          </div>
          <div
            v-if="modelFormStore.productPassport"
            class="border-t border-gray-100"
          >
            <dl class="divide-y divide-gray-100">
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-900">
                  {{ t('models.form.id') }}
                </dt>
                <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {{ modelFormStore.getUUID() }}
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-900">
                  {{ t('models.form.name.label') }}
                </dt>
                <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {{ modelFormStore.productPassport.name }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <Galleria :value="modelFormStore.mediaFiles.length > 0 ? modelFormStore.mediaFiles : [{ url: emptyState }]" :show-thumbnails="modelFormStore.mediaFiles.length > 0" thumbnails-position="bottom" :num-visible="5" container-style="max-width: 340px">
          <template #header>
            <div class="p-2">
              <Button :label="modelFormStore.mediaFiles.length > 0 ? t('common.edit') : t('common.add')" @click="galleriaEditDialogIsVisible = true" />
            </div>
          </template>
          <template #item="slotProps">
            <Image :src="slotProps.item.url" alt="Image" width="100%" preview />
          </template>
          <template #thumbnail="slotProps">
            <div class="ml-2 mr-2">
              <Image :src="slotProps.item.url" width="40px" />
            </div>
          </template>
        </Galleria>
      </div>
      <PassportForm
        v-if="modelFormStore.productPassport && !modelFormStore.fetchInFlight"
      />
    </div>
    <GalleriaEditDialog
      v-model:visible="galleriaEditDialogIsVisible"
      :title="t('models.form.mediaEditDialog')"
      :images="modelFormStore.mediaFiles"
      @add-images="addMedia"
    />
  </div>
</template>
