<script lang="ts" setup>
import { onBeforeUnmount, ref, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import ViewInformation from "../../components/presentation-components-old/ViewInformation.vue";
import Passport from "../../components/presentation/Passport.vue";
import apiClient from "../../lib/api-client.ts";
import { useAnalyticsStore } from "../../stores/analytics.ts";
import { usePassportStore } from "../../stores/passport.ts";
import { useProductPassportStore } from "../../stores/product-passport.ts";

const route = useRoute();
const router = useRouter();

const productPassportStore = useProductPassportStore();
const passportStore = usePassportStore();
const analyticsStore = useAnalyticsStore();
const isLegacy = ref(true);

async function loadLegacyProductPassport(id: string): Promise<boolean> {
  const response = await apiClient.dpp.productPassports.getById(id);
  if (response.status === 404) {
    return false;
  }

  await analyticsStore.addPageView();
  productPassportStore.productPassport = response.data;
  await productPassportStore.loadMedia();

  return true;
}

async function loadPassport(id: string): Promise<boolean> {
  const response = await apiClient.dpp.uniqueProductIdentifiers.getPassport(id);
  if (response.status === 404) {
    return false;
  }

  passportStore.productPassport = response.data;

  const submodels = await apiClient.dpp.uniqueProductIdentifiers.aas.getSubmodels(id, {});

  passportStore.submodels = submodels.data.result || [];

  const aas = await apiClient.dpp.uniqueProductIdentifiers.aas.getShells(id, {});

  passportStore.shells = aas.data.result;

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

// Cleanup object URLs when component unmounts to prevent memory leaks
onBeforeUnmount(() => {
  productPassportStore.cleanupMediaUrls();
});

watchEffect(async () => {
  const permalink = String(route.params.permalink);
  let passportAvailable = false;
  try {
    passportAvailable = await loadLegacyProductPassport(permalink);
  }
  catch (e) {
    console.error(e);
  }
  if (!passportAvailable) {
    try {
      passportAvailable = await loadPassport(permalink);
      isLegacy.value = false;
    }
    catch (e) {
      console.error(e);
    }
  }

  if (!passportAvailable) {
    await pushNotFound(permalink);
  }
});
</script>

<template>
  <div class="flex flex-col items-center gap-5">
    <ViewInformation v-if="isLegacy" />
    <Passport v-else />
  </div>
</template>
