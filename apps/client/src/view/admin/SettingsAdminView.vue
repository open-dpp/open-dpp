<script lang="ts" setup>
import { useToast } from "primevue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import { type BooleanSettingsResponseDto } from "@open-dpp/dto";
import { authClient } from "../../auth-client.ts";

const { t } = useI18n();
const errorHandlingStore = useErrorHandlingStore();
const toast = useToast();
type InstanceSetting = {
  key: "signupEnabled" | "organizationCreationEnabled";
  setting: BooleanSettingsResponseDto;
};

const instanceSettings = ref<InstanceSetting[]>([
  {
    key: "signupEnabled",
    setting: { value: true },
  },
  {
    key: "organizationCreationEnabled",
    setting: { value: true },
  },
]);

const isSaving = ref(false);
const loading = ref(true);

async function fetchSettings() {
  try {
    loading.value = true;
    const res = await apiClient.dpp.instanceSettings.get();
    for (const setting of instanceSettings.value) {
      setting.setting = res.data[setting.key];
    }
  } catch (error) {
    errorHandlingStore.logErrorWithNotification(
      t("organizations.admin.instanceSettings.error"),
      error,
    );
  } finally {
    loading.value = false;
  }
}

async function toggleInstanceSetting(settingKey: string) {
  const setting = instanceSettings.value.find((s) => s.key === settingKey);
  if (!setting || setting.setting.locked || isSaving.value) {
    return;
  }
  isSaving.value = true;
  try {
    const res = await apiClient.dpp.instanceSettings.update({
      [setting.key]: setting.setting.value,
    });
    setting.setting = res.data[setting.key];
    toast.add({
      severity: "success",
      summary: t("organizations.admin.instanceSettings.saved"),
      life: 3000,
    });
  } catch (error) {
    setting.setting.value = !setting.setting.value;
    errorHandlingStore.logErrorWithNotification(
      t("organizations.admin.instanceSettings.error"),
      error,
    );
  } finally {
    isSaving.value = false;
  }
}

onMounted(async () => {
  await fetchSettings();
});
</script>

<template>
  <section>
    <div class="flex flex-col gap-3 p-3">
      <h2 class="text-lg font-semibold">
        {{ t("organizations.admin.instanceSettings.title") }}
      </h2>
      <InstanceSettingToogle
        v-for="setting in instanceSettings"
        v-model:model-value="setting.setting.value"
        @update:model-value="toggleInstanceSetting(setting.key)"
        :key="setting.key"
        :loading="loading"
        :isSaving="isSaving"
        :isLocked="!!setting.setting.locked"
        :translationKey="setting.key"
      />
    </div>
  </section>
</template>
