<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AASEditor from "../../components/aas/AASEditor.vue";
import { DigitalProductDocumentType } from "../../lib/digital-product-document.ts";

const route = useRoute();
const id = computed(() => (route.params.passportId ? String(route.params.passportId) : undefined));
</script>

<template>
  <div v-if="id" class="flex flex-col gap-3 p-4">
    <DigitalProductDocumentToolbar :id="id" :type="DigitalProductDocumentType.Passport" />
    <AASEditor :id="id" class="h-[calc(100vh-64px)]" :type="DigitalProductDocumentType.Passport" />
  </div>
</template>
