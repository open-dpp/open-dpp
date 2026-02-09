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
  const passport = await apiClient.dpp.uniqueProductIdentifiers.getPassport(String(route.params.passportId));
  link.value = `/presentation/${upid.data.id}`;
  content.value = `${VIEW_ROOT_URL}/presentation/${upid.data.id}`;
});
</script>

<template>
  <QrCode v-if="link && content" :link="link" :content="content" />
</template>
