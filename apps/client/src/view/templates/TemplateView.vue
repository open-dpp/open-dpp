<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import AASEditor from "../../components/aas/AASEditor.vue";
import { DigitalProductDocumentType } from "../../lib/digital-product-document.ts";
import { useDigitalProductDocument } from "../../composables/digital-product-document.ts";
import type { DigitalProductDocumentDto } from "@open-dpp/dto";

const route = useRoute();
const id = computed(() => (route.params.templateId ? String(route.params.templateId) : undefined));
const { fetchById } = useDigitalProductDocument(DigitalProductDocumentType.Template);
const item = ref<DigitalProductDocumentDto>();

watch(
  () => id.value,
  async (newValue) => {
    if (newValue) {
      item.value = await fetchById(newValue);
    } else {
      item.value = undefined;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="item" class="flex flex-col gap-3 p-4">
    <DigitalProductDocumentToolbar v-model="item" :type="DigitalProductDocumentType.Template" />
    <AASEditor
      v-model="item"
      class="h-[calc(100vh-64px)]"
      :type="DigitalProductDocumentType.Template"
    />
  </div>
</template>
