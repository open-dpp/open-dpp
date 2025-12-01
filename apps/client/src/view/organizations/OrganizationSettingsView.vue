<script lang="ts" setup>
import type { FileUploadSelectEvent } from "primevue/fileupload";
import type { MediaInfo } from "../../components/media/MediaInfo.interface";
import Button from "primevue/button";
import FileUpload from "primevue/fileupload";
import InputText from "primevue/inputtext";
import { onMounted, ref } from "vue";

import { useI18n } from "vue-i18n";

import { authClient } from "../../auth-client.ts";
import MediaPreview from "../../components/media/MediaPreview.vue";
import { useIndexStore } from "../../stores";
import { useMediaStore } from "../../stores/media";
import { useOrganizationsStore } from "../../stores/organizations";

const { t } = useI18n();
const organizationStore = useOrganizationsStore();
const mediaStore = useMediaStore();
const indexStore = useIndexStore();

const name = ref("");
const currentMedia = ref<MediaInfo | null>(null);
const submitted = ref(false);
const selectedFile = ref<File | null>(null);
const fileUploadKey = ref(0);

async function fetchOrganization() {
  const { data } = await authClient.organization.getFullOrganization();
  if (data) {
    name.value = data.name;
    const imageId = (data as any).image;
    if (imageId) {
      try {
        currentMedia.value = await mediaStore.getMediaInfo(imageId);
      }
      catch (e) {
        console.error("Failed to fetch media info", e);
      }
    }
  }
}

function onFileSelect(event: FileUploadSelectEvent) {
  if (event.files && event.files.length > 0) {
    selectedFile.value = event.files[0];
  }
}

async function save() {
  submitted.value = true;
  if (!name.value)
    return;

  if (!indexStore.selectedOrganization)
    return;

  let imageUrl;

  if (selectedFile.value) {
    try {
      imageUrl = await mediaStore.uploadMedia(indexStore.selectedOrganization, selectedFile.value);
    }
    catch (e) {
      console.error("Failed to upload image", e);
      // Handle error
    }
  }

  await authClient.organization.update({
    organizationId: indexStore.selectedOrganization,
    data: {
      name: name.value,
      ...(imageUrl ? { image: imageUrl } : {}),
    },
  });

  await fetchOrganization();
  await organizationStore.fetchOrganizations();

  selectedFile.value = null;
  fileUploadKey.value++;
  submitted.value = false;
}

onMounted(() => {
  fetchOrganization();
});
</script>

<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-base font-semibold leading-6 text-gray-900">
        {{ t('organizations.settings.title') }}
      </h3>
      <div class="mt-5 max-w-xl">
        <form @submit.prevent="save">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label for="name" class="block text-sm font-medium leading-6 text-gray-900">{{ t('organizations.form.name.label') }}</label>
              <InputText id="name" v-model="name" :invalid="submitted && !name" />
              <small v-if="submitted && !name" class="text-red-500">{{ t('organizations.form.name.error') }}</small>
            </div>

            <div v-if="currentMedia" class="mb-4">
              <div class="block text-sm font-medium leading-6 text-gray-900 mb-2">
                {{ t('organizations.form.image.label') }}
              </div>
              <MediaPreview
                :key="currentMedia.id"
                :media="currentMedia"
                :preview="false"
              />
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <FileUpload
                  :key="fileUploadKey"
                  mode="basic"
                  name="image"
                  accept="image/*"
                  :max-file-size="1000000"
                  :choose-label="t('common.select')"
                  auto
                  custom-upload
                  @select="onFileSelect"
                />
                <span v-if="selectedFile" class="text-sm text-gray-600">{{ selectedFile.name }}</span>
              </div>
              <small class="text-gray-500">{{ t('organizations.form.image.help') }}</small>
            </div>

            <div class="mt-4">
              <Button type="submit" :label="t('common.save')" />
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
