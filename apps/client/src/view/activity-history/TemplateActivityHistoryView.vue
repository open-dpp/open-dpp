<script setup lang="ts">
import { useRoute } from "vue-router";
import { computed } from "vue";
import { DigitalProductDocumentType } from "../../lib/digital-product-document.ts";

const route = useRoute();
const id = computed(() => (route.params.templateId ? String(route.params.templateId) : undefined));
</script>

<template>
  <ActivityHistory v-if="id" :id="id" :type="DigitalProductDocumentType.Template" />
</template>
