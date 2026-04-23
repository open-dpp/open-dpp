<script lang="ts" setup>
import { LockClosedIcon } from "@heroicons/vue/24/outline";
import { Card, ToggleSwitch, useToast } from "primevue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";

const { t } = useI18n();
const errorHandlingStore = useErrorHandlingStore();
const toast = useToast();

const signupEnabled = ref(true);
const isSignupLocked = ref(false);
const isSaving = ref(false);
const loading = ref(true);

async function fetchSettings() {
  try {
    loading.value = true;
    const res = await apiClient.dpp.instanceSettings.get();
    signupEnabled.value = res.data.signupEnabled.value;
    isSignupLocked.value = !!res.data.signupEnabled.locked;
  } catch (error) {
    errorHandlingStore.logErrorWithNotification(
      t("organizations.admin.instanceSettings.error"),
      error,
    );
  } finally {
    loading.value = false;
  }
}

async function toggleSignup() {
  if (isSignupLocked.value || isSaving.value) {
    return;
  }
  isSaving.value = true;
  try {
    const res = await apiClient.dpp.instanceSettings.update({
      signupEnabled: signupEnabled.value,
    });
    signupEnabled.value = res.data.signupEnabled.value;
    toast.add({
      severity: "success",
      summary: t("organizations.admin.instanceSettings.saved"),
      life: 3000,
    });
  } catch (error) {
    signupEnabled.value = !signupEnabled.value;
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
        v-model:model-value="signupEnabled"
        @update:model-value="toggleSignup"
        :loading="loading"
        :isSaving="isSaving"
        :isLocked="isSignupLocked"
        translationKey="signupEnabled"
      />
    </div>
  </section>
</template>
