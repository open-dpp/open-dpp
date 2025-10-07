<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import QrCode from "../../components/QrCode.vue";
import { VIEW_ROOT_URL } from "../../const";
import apiClient from "../../lib/api-client";

const route = useRoute();
const link = ref<string>();
const content = ref<string>();

onMounted(async () => {
  const response = await apiClient.dpp.models.getById(
    String(route.params.modelId),
  );
  const model = response.data as any;
  link.value = `/presentation/${model.uniqueProductIdentifiers[0].uuid}`;
  content.value = `${VIEW_ROOT_URL}/presentation/${model.uniqueProductIdentifiers[0].uuid}`;
});
</script>

<template>
  <QrCode v-if="link && content" :link="link" :content="content" />
</template>
