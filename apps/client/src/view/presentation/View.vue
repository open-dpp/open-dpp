<script lang="ts" setup>
import { onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ViewInformation from "../../components/presentation-components/ViewInformation.vue";
import apiClient from "../../lib/api-client";
import { useAnalyticsStore } from "../../stores/analytics.ts";
import { useProductPassportStore } from "../../stores/product-passport";

const route = useRoute();
const router = useRouter();

const productPassportStore = useProductPassportStore();
const analyticsStore = useAnalyticsStore();

// Cleanup object URLs when component unmounts to prevent memory leaks
onBeforeUnmount(() => {
  productPassportStore.cleanupMediaUrls();
});

watch(
  () => route.params.permalink,
  async () => {
    const permalink = String(route.params.permalink);
    try {
      const response = await apiClient.dpp.productPassports.getById(permalink);
      await analyticsStore.addPageView();
      if (response.status === 404) {
        await router.push({
          path: "404",
          query: {
            permalink,
          },
        });
        return;
      }
      productPassportStore.productPassport = response.data;
      await productPassportStore.loadMedia();
    }
    catch (e) {
      console.error(e);
      await router.push({
        path: "404",
        query: {
          permalink,
        },
      });
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-col items-center gap-5">
    <ViewInformation />
  </div>
</template>
