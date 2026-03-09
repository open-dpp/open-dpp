<script lang="ts" setup>
import { Card, Message, ToggleSwitch } from "primevue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";

const { t } = useI18n();
const errorHandlingStore = useErrorHandlingStore();

const signupEnabled = ref(true);
const loading = ref(true);
const saveSuccess = ref(false);

async function fetchSettings() {
  try {
    loading.value = true;
    const res = await apiClient.dpp.instanceSettings.get();
    signupEnabled.value = res.data.signupEnabled;
  }
  catch (error) {
    errorHandlingStore.logErrorWithNotification(
      t("organizations.admin.instanceSettings.error"),
      error,
    );
  }
  finally {
    loading.value = false;
  }
}

async function toggleSignup() {
  saveSuccess.value = false;
  try {
    const res = await apiClient.dpp.instanceSettings.update({
      signupEnabled: signupEnabled.value,
    });
    signupEnabled.value = res.data.signupEnabled;
    saveSuccess.value = true;
  }
  catch (error) {
    signupEnabled.value = !signupEnabled.value;
    errorHandlingStore.logErrorWithNotification(
      t("organizations.admin.instanceSettings.error"),
      error,
    );
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

      <Card v-if="!loading">
        <template #content>
          <div class="flex flex-col gap-4">
            <Message v-if="saveSuccess" severity="success" :closable="true" @close="saveSuccess = false">
              {{ t("organizations.admin.instanceSettings.saved") }}
            </Message>

            <div class="flex items-center gap-3">
              <ToggleSwitch
                v-model="signupEnabled"
                @update:model-value="toggleSignup"
              />
              <div class="flex flex-col">
                <span class="font-medium">
                  {{ t("organizations.admin.instanceSettings.signupEnabled") }}
                </span>
                <span class="text-sm text-gray-500">
                  {{ t("organizations.admin.instanceSettings.signupEnabledDescription") }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </section>
</template>
