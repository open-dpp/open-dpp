<script lang="ts" setup>
import type { MediaResult } from "../../components/media/MediaInfo.interface";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { computed, onMounted, ref } from "vue";

import { useI18n } from "vue-i18n";

import { authClient } from "../../auth-client.ts";
import MediaInput from "../../components/media/MediaInput.vue";
import { useIndexStore } from "../../stores";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { useMediaStore } from "../../stores/media";
import { useOrganizationsStore } from "../../stores/organizations";

const { t } = useI18n();
const organizationStore = useOrganizationsStore();
const mediaStore = useMediaStore();
const indexStore = useIndexStore();
const errorHandlingStore = useErrorHandlingStore();

const name = ref("");
const currentMedia = ref<MediaResult | null>(null);
const submitted = ref(false);
const selectedFile = ref<File | null>(null);
const fileUploadKey = ref(0);

const mediaInputId = computed(() => `organization-image-${indexStore.selectedOrganization}`);

async function fetchOrganization() {
  const { data } = await authClient.organization.getFullOrganization();
  if (data) {
    name.value = data.name;
    const imageId = (data as any).image;
    if (imageId) {
      await fetchMedia(imageId);
    }
  }
}

async function fetchMedia(mediaId: string | null) {
  if (mediaId) {
    try {
      currentMedia.value = await mediaStore.fetchMedia(mediaId);
    }
    catch (e) {
      console.error("Failed to fetch media info", e);
    }
  }
}

async function save() {
  submitted.value = true;
  if (!name.value)
    return;

  if (!indexStore.selectedOrganization)
    return;

  let image;

  if (currentMedia.value && currentMedia.value.mediaInfo.id) {
    image = currentMedia.value.mediaInfo.id;
  }

  if (selectedFile.value) {
    try {
      image = await mediaStore.uploadOrganizationProfileMedia(indexStore.selectedOrganization, selectedFile.value);
    }
    catch (e) {
      console.error("Failed to upload image", e);
      // Handle error
    }
  }

  try {
    await authClient.organization.update({
      organizationId: indexStore.selectedOrganization,
      data: {
        name: name.value,
        ...(image ? { image } : {}),
      },
    });

    await fetchOrganization();
    await organizationStore.fetchOrganizations();
  }
  catch (e) {
    errorHandlingStore.logErrorWithNotification(t("organizations.form.updateError"), e);
  }
  finally {
    selectedFile.value = null;
    fileUploadKey.value++;
    submitted.value = false;
  }
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

            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <MediaInput
                  :id="mediaInputId"
                  context="organization"
                  :label="t('organizations.form.image.label')"
                  :value="currentMedia"
                  @update-by-id="(id) => fetchMedia(id)"
                  @select-file="(file) => selectedFile = file"
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
