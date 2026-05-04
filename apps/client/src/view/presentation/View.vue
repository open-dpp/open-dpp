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
  if (response.status !== 200) {
    errorHandlingStore.logErrorWithNotification(
      t("presentation.loadPassportError"),
      new Error(`Unexpected status ${response.status} while loading passport`),
    );
    return false;
  }

  passportStore.productPassport = response.data;

  const submodels = await apiClient.dpp.permalinks.aas.getSubmodels(id, {});
  if (submodels.status !== 200) {
    errorHandlingStore.logErrorWithNotification(
      t("presentation.loadSubmodelsError"),
      new Error(`Unexpected status ${submodels.status} while loading submodels`),
    );
    return false;
  }
  passportStore.submodels = submodels.data.result || [];

  const aas = await apiClient.dpp.permalinks.aas.getShells(id, {});
  if (aas.status !== 200) {
    errorHandlingStore.logErrorWithNotification(
      t("presentation.loadShellsError"),
      new Error(`Unexpected status ${aas.status} while loading shells`),
    );
    return false;
  }
  passportStore.shells = aas.data.result || [];

  try {
    const presentationConfig = await apiClient.dpp.permalinks.getPresentationConfiguration(id);
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
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("presentation.loadPassportError"), error);
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
