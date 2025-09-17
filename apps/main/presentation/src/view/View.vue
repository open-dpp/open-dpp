<template>
  <div class="flex flex-col items-center gap-5">
    <ViewInformation />
  </div>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from "vue-router";
import { watch } from "vue";
import ViewInformation from "../components/ViewInformation.vue";
import { useProductPassportStore } from "../stores/product-passport";
import apiClient from "../lib/api-client";

const route = useRoute();
const router = useRouter();

const viewStore = useProductPassportStore();

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
            permalink: permalink,
          },
        });
        return;
      }
      viewStore.productPassport = response.data;
    } catch (e) {
      console.error(e);
      await router.push({
        path: "404",
        query: {
          permalink: permalink,
        },
      });
      return;
    }
  },
  { immediate: true },
);
</script>
