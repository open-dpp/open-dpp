<script lang="ts" setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import AASEditor from "../../components/aas/AASEditor.vue";
import { AasEditMode } from "../../lib/aas-editor.ts";
import apiClient from "../../lib/api-client.ts";
import type { DigitalProductDocumentDto } from "@open-dpp/dto";
import { useRouterUtils } from "../../composables/router-utils.ts";
import { useTemplates } from "../../composables/templates.ts";

const route = useRoute();
const { goToParent } = useRouterUtils();

const dppItem = ref<DigitalProductDocumentDto>();

const { publish, archive, restore, deleteTemplate } = useTemplates();

async function fetchTemplate(id: string) {
  if (id) {
    dppItem.value = (await apiClient.dpp.templates.getById(id)).data;
  }
}

watch(
  () => route.params.passportId,
  async (newValue) => {
    if (newValue) {
      await fetchTemplate(String(newValue));
    } else {
      dppItem.value = undefined;
    }
  },
  { immediate: true },
);

async function onDeleteButtonClicked(item: DigitalProductDocumentDto) {
  await deleteTemplate(item.id, async () => {
    await goToParent();
  });
}

async function onArchiveButtonClicked(item: DigitalProductDocumentDto) {
  await archive(item.id);
  await fetchTemplate(item.id);
}

async function onRestoreButtonClicked(item: DigitalProductDocumentDto) {
  await restore(item.id);
  await fetchTemplate(item.id);
}

async function onPublishButtonClicked(item: DigitalProductDocumentDto) {
  await publish(item.id);
  await fetchTemplate(item.id);
}
</script>

<template>
  <AASEditor
    v-if="dppItem"
    :id="dppItem.id"
    class="h-[calc(100vh-64px)]"
    :editor-mode="AasEditMode.Template"
  />
</template>
