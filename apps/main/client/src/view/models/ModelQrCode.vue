<template>
  <QrCode v-if="url" :url="url" />
</template>
<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { VIEW_ROOT_URL } from "../../const";
import QrCode from "../../components/QrCode.vue";
import apiClient from "../../lib/api-client";

const route = useRoute();
const url = ref<string>();

onMounted(async () => {
  const response = await apiClient.dpp.models.getById(
    String(route.params.modelId),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = response.data as any;
  url.value = `${VIEW_ROOT_URL}/${model.uniqueProductIdentifiers[0].uuid}`;
});
</script>
