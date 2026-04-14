<script lang="ts" setup>
import type { OrganizationDto } from "@open-dpp/api-client";
import type { BrandingDto } from "@open-dpp/dto";
import { updatePreset } from "@primeuix/themes";
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

function lightenHexColor(hex: string, amount: number): string {
  const normalizedHex = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalizedHex)) {
    return normalizedHex;
  }

  const channel = (index: number) => {
    const value = Number.parseInt(normalizedHex.slice(index, index + 2), 16);
    const adjusted = Math.round(value + (255 - value) * amount);
    return Math.min(255, Math.max(0, adjusted)).toString(16).padStart(2, "0");
  };

  return `${channel(0)}${channel(2)}${channel(4)}`;
}

async function save() {
  if (
    !organization.value
    || !branding.value
    || !indexStore.selectedOrganization
  ) {
    return;
  }

  try {
    const result = await apiClient.dpp.organizations.update(
      indexStore.selectedOrganization,
      {
        name: organization.value.name,
      },
    );

    const brandingResult = await apiClient.dpp.branding.set({
      logo: branding.value.logo,
      primaryColor: branding.value.primaryColor,
    });

    branding.value = brandingResult.data;
    const primaryColor = branding.value.primaryColor ?? "000000";

    updatePreset({
      semantic: {
        primary: {
          500: `#${primaryColor}`,
          600: `#${lightenHexColor(primaryColor, 0.08)}`,
        },
      },
    });

    nameInvalid.value = false;
    organization.value = result.data;

    await organizationStore.fetchOrganizations();
    await applyBranding();
    notificationStore.addSuccessNotification(
      t("organizations.form.updateSuccess"),
    );
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
      <form v-if="branding" class="mt-5">
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
          </div>
        </div>
      </form>

      <div class="mt-4">
        <Button type="submit" :label="t('common.save')" @click="save" />
      </div>
    </div>
  </ContentViewWrapper>
</template>
