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
  const upid = await apiClient.dpp.uniqueProductIdentifiers.getByReference(String(route.params.passportId));
  link.value = `/presentation/${upid.data[0]?.uuid}`;
  content.value = `${VIEW_ROOT_URL}/presentation/${upid.data[0]?.uuid}`;
});
</script>

<template>
  <QrCode v-if="link && content" :link="link" :content="content" />
</template>
