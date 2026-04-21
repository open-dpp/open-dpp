<script lang="ts" setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import Passport from "../../components/presentation/Passport.vue";
import apiClient from "../../lib/api-client.ts";
import { useAnalyticsStore } from "../../stores/analytics.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import { usePassportStore } from "../../stores/passport.ts";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const passportStore = usePassportStore();
const analyticsStore = useAnalyticsStore();
const errorHandlingStore = useErrorHandlingStore();
const passportAvailable = ref(false);

async function loadPassport(id: string): Promise<boolean> {
  const response = await apiClient.dpp.permalinks.getPassport(id);
  if (response.status === 404) {
    return false;
  }

  passportStore.productPassport = response.data;

  const submodels = await apiClient.dpp.permalinks.aas.getSubmodels(id, {});
  if (submodels.status !== 200) {
    console.error("Failed to load submodels");
    return false;
  }
  passportStore.submodels = submodels.data.result || [];

  const aas = await apiClient.dpp.permalinks.aas.getShells(id, {});
  if (aas.status !== 200) {
    console.error("Failed to load shells");
    return false;
  }
  passportStore.shells = aas.data.result || [];

  try {
    const presentationConfig =
      await apiClient.dpp.permalinks.getPresentationConfiguration(id);
    passportStore.presentationConfig = presentationConfig.data;
  } catch (error) {
    errorHandlingStore.logErrorWithNotification(
      t("presentation.loadPresentationConfigError"),
      error,
    );
    passportStore.presentationConfig = null;
  }

  await analyticsStore.addPageView();

  return true;
}

async function pushNotFound(permalink: string) {
  await router.push({
    path: "404",
    query: {
      permalink,
    },
  });
}

watch(
  () => String(route.params.permalink ?? ""),
  async (permalink, _prev, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    passportAvailable.value = false;
    try {
      passportAvailable.value = await loadPassport(permalink);
    } catch (e) {
      console.error(e);
    }

    if (!cancelled && !passportAvailable.value) {
      await pushNotFound(permalink);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-col items-center gap-5">
    <Passport v-if="passportAvailable" />
  </div>
</template>
