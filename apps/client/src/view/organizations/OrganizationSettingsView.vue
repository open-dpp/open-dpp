<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { authClient } from "../../auth-client.ts";
import type { MediaInfo } from "../../components/media/MediaInfo.interface";
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

async function save(fields: any) {
  if (!indexStore.selectedOrganization)
    return;

  let imageUrl;

  if (fields.image && fields.image.length > 0) {
    const fileItem = fields.image[0];
    const file = fileItem.file;

    if (file) {
      try {
        const mediaId = await mediaStore.uploadMedia(indexStore.selectedOrganization, file);
        imageUrl = mediaId;
      }
      catch (e) {
        console.error("Failed to upload image", e);
        // Handle error
      }
    }
  }

  await authClient.organization.update({
    organizationId: indexStore.selectedOrganization,
    data: {
      name: fields.name,
      ...(imageUrl ? { image: imageUrl } : {}),
    },
  });

  await fetchOrganization();
  await organizationStore.fetchOrganizations();
}

onMounted(() => {
  fetchOrganization();
});
</script>

<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-base font-semibold leading-6 text-gray-900">
        {{ t('organizations.settings') }}
      </h3>
      <div class="mt-5 max-w-xl">
        <FormKit
          type="form"
          :actions="false"
          @submit="save"
        >
          <FormKit
            v-model="name"
            type="text"
            name="name"
            :label="t('organizations.form.name.label')"
            validation="required"
          />

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

          <FormKit
            type="file"
            name="image"
            :label="t('organizations.form.image.label')"
            :help="t('organizations.form.image.help')"
            accept="image/*"
          />

          <div class="mt-4">
            <FormKit type="submit" :label="t('common.save')" />
          </div>
        </FormKit>
      </div>
    </div>
  </div>
</template>
