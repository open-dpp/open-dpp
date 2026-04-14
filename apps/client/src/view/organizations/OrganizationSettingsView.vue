<script lang="ts" setup>
import type { OrganizationDto } from "@open-dpp/api-client";
import type { BrandingDto } from "@open-dpp/dto";
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
const branding = ref<BrandingDto | null>(null);
const nameInvalid = ref(false);
const { applyBranding } = useBranding();

async function save() {
  try {
    let updatedSettings = false;
    if (organization.value && indexStore.selectedOrganization) {
      const result = await apiClient.dpp.organizations.update(
        indexStore.selectedOrganization,
        {
          name: organization.value.name,
        },
      );

      nameInvalid.value = false;
      organization.value = result.data;
      updatedSettings = true;

      await organizationStore.fetchOrganizations();
    }

    if (branding.value) {
      const brandingResult = await apiClient.dpp.branding.set({
        logo: branding.value.logo,
        primaryColor: branding.value.primaryColor,
      });

      branding.value = brandingResult.data;
      updatedSettings = true;
    }

    if (updatedSettings) {
      await applyBranding();
      notificationStore.addSuccessNotification(
        t("organizations.form.updateSuccess"),
      );
    }
  }
  catch (e) {
    nameInvalid.value = true;
    errorHandlingStore.logErrorWithNotification(
      t("organizations.form.updateError"),
      e,
    );
  }
}

onMounted(async () => {
  organization.value = await organizationStore.fetchCurrentOrganization();
  branding.value = (await apiClient.dpp.branding.get()).data;
});
</script>

<template>
  <ContentViewWrapper>
    <h3 class="text-xl py-2 font-semibold leading-6 text-gray-900">
      {{ t("organizations.settings.title") }}
    </h3>
    <div class="mt-5 max-w-xl">
      <form
        v-if="organization"
        class="flex flex-col gap-4"
        @submit.prevent="save"
      >
        <div class="flex flex-col gap-2">
          <label
            for="name"
            class="block text-sm font-medium leading-6 text-gray-900"
          >{{ t("organizations.form.name.label") }}</label>
          <InputText
            id="name"
            v-model="organization.name"
            :invalid="nameInvalid"
          />
          <small v-if="nameInvalid" class="text-red-500">{{
            t("organizations.form.name.error")
          }}</small>
        </div>
      </form>
      <form v-if="branding" @submit.prevent="save" class="mt-5">
        <h3 class="text-lg py-2 font-semibold leading-6 text-gray-900">
          {{ t("organizations.settings.branding") }}
        </h3>

        <MediaInput
          v-model="branding.logo"
          class="mt-4"
          context="organization"
          :label="t('organizations.form.image.label')"
        />
        <div class="flex flex-col gap-2">
          <label
            for="name"
            class="block text-sm font-medium leading-6 text-gray-900"
          >{{ t("organizations.form.color.label") }}</label>
          <small class="text-gray-700">{{
            t("organizations.form.color.description")
          }}</small>
          <div class="flex items-center gap-2">
            <ColorPicker
              id="name"
              v-model="branding.primaryColor"
              :invalid="nameInvalid"
            />
            <InputGroup>
              <InputGroupAddon>#</InputGroupAddon>
              <InputText
                id="name"
                v-model="branding.primaryColor"
                maxlength="6"
                inputmode="text"
                :invalid="nameInvalid"
              />
            </InputGroup>
            <Button
              severity="secondary"
              :disabled="branding.primaryColor === null"
              @click="branding.primaryColor = null"
            >
              {{ t("common.reset") }}
            </Button>
          </div>
        </div>
      </form>

      <div class="mt-4">
        <Button type="submit" :label="t('common.save')" @click="save" />
      </div>
    </div>
  </ContentViewWrapper>
</template>
