<script lang="ts" setup>
import type { OrganizationDto } from "@open-dpp/api-client";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import MediaInput from "../../components/media/MediaInput.vue";
import { useBranding } from "../../composables/branding";
import apiClient from "../../lib/api-client";
import { useIndexStore } from "../../stores";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { useNotificationStore } from "../../stores/notification";
import { useOrganizationsStore } from "../../stores/organizations";
import ContentViewWrapper from "../ContentViewWrapper.vue";

const { t } = useI18n();
const organizationStore = useOrganizationsStore();
const indexStore = useIndexStore();
const errorHandlingStore = useErrorHandlingStore();
const notificationStore = useNotificationStore();

const organization = ref<OrganizationDto | null>(null);
const nameInvalid = ref(false);
const { applyBranding } = useBranding();

async function save() {
  if (!organization.value || !indexStore.selectedOrganization) return;

  try {
    const result = await apiClient.dpp.organizations.update(indexStore.selectedOrganization, {
      name: organization.value.name,
      logo: organization.value.logo,
    });

    nameInvalid.value = false;
    organization.value = result.data;

    await organizationStore.fetchOrganizations();
    await applyBranding();
    notificationStore.addSuccessNotification(t("organizations.form.updateSuccess"));
  } catch (e) {
    nameInvalid.value = true;
    errorHandlingStore.logErrorWithNotification(t("organizations.form.updateError"), e);
  }
}

onMounted(async () => {
  organization.value = await organizationStore.fetchCurrentOrganization();
});
</script>

<template>
  <ContentViewWrapper>
    <h3 class="py-2 text-xl leading-6 font-semibold text-gray-900">
      {{ t("organizations.settings.title") }}
    </h3>
    <div class="mt-5 max-w-xl">
      <form v-if="organization" @submit.prevent="save">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label for="name" class="block text-sm leading-6 font-medium text-gray-900">{{
              t("organizations.form.name.label")
            }}</label>
            <InputText id="name" v-model="organization.name" :invalid="nameInvalid" />
            <small v-if="nameInvalid" class="text-red-500">{{
              t("organizations.form.name.error")
            }}</small>
          </div>

          <div class="flex flex-col gap-2">
            <MediaInput
              v-model="organization.logo"
              context="organization"
              :label="t('organizations.form.image.label')"
            />
          </div>

          <div class="mt-4">
            <Button type="submit" :label="t('common.save')" />
          </div>
        </div>
      </form>
    </div>
  </ContentViewWrapper>
</template>
