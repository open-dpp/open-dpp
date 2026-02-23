<script lang="ts" setup>
import type { ProductPassportDto } from "@open-dpp/api-client";
import { onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ViewInformation from "../../components/presentation-components/ViewInformation.vue";
import apiClient from "../../lib/api-client.ts";
import { useProductPassportStore } from "../../stores/product-passport";

const route = useRoute();
const router = useRouter();

const productPassportStore = useProductPassportStore();

function isProductPassportDto(value: unknown): value is ProductPassportDto {
  return (
    !!value
    && typeof value === "object"
    && "id" in value
    && "name" in value
    && "description" in value
    && "mediaReferences" in value
    && "dataSections" in value
    && "organizationName" in value
  );
}

// Analytics tracking is intentionally disabled until the AAS view integration is restored.
// const analyticsStore = useAnalyticsStore();
// await analyticsStore.addPageView();

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
      if (response.status === 404) {
        await router.push({
          path: "404",
          query: {
            permalink,
          },
        });
        return;
      }
      const data = response.data as ProductPassportDto | { passport?: ProductPassportDto };
      const passport = isProductPassportDto(data) ? data : data.passport;
      if (!passport) {
        console.error("Passport not found in response");
        await router.push({
          path: "404",
          query: {
            permalink,
          },
        });
        return;
      }
      productPassportStore.productPassport = passport;
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
