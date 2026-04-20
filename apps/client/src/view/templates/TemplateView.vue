<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AASEditor from "../../components/aas/AASEditor.vue";
import { DigitalProductDocumentType } from "../../lib/digital-product-document.ts";

const route = useRoute();
const id = computed(() => (route.params.templateId ? String(route.params.templateId) : undefined));
</script>

<template>
  <div v-if="id" class="flex flex-col gap-3 p-4">
    <DigitalProductDocumentToolbar :id="id" :type="DigitalProductDocumentType.Template" />
    <AASEditor :id="id" class="h-[calc(100vh-64px)]" :type="DigitalProductDocumentType.Template" />
  </div>
</template>
