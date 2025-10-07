<script lang="ts" setup>
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ViewInformation from "../../components/presentation-components/ViewInformation.vue";
import apiClient from "../../lib/api-client";
import { useProductPassportStore } from "../../stores/product-passport";

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
            permalink,
          },
        });
        return;
      }
      viewStore.productPassport = response.data;
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
