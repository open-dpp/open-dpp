<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AASEditor from "../../components/aas/AASEditor.vue";
import { AasEditMode } from "../../lib/aas-editor.ts";
import apiClient from "../../lib/api-client.ts";
import { DigitalProductDocumentStatusDto, type DigitalProductDocumentDto } from "@open-dpp/dto";
import { usePassports } from "../../composables/passports.ts";
import { useI18n } from "vue-i18n";
import { useRouterUtils } from "../../composables/router-utils.ts";

const route = useRoute();
const { goToParent } = useRouterUtils();
const dppItem = ref<DigitalProductDocumentDto>();

const { publish, archive, restore, deletePassport } = usePassports();

async function fetchPassport(id: string) {
  if (id) {
    dppItem.value = (await apiClient.dpp.passports.getById(id)).data;
  }
}

watch(
  () => route.params.passportId,
  async (newValue) => {
    if (newValue) {
      await fetchPassport(String(newValue));
    } else {
      dppItem.value = undefined;
    }
  },
  { immediate: true },
);

async function onDeleteButtonClicked(item: DigitalProductDocumentDto) {
  await deletePassport(item.id, async () => {
    await goToParent();
  });
}

async function onArchiveButtonClicked(item: DigitalProductDocumentDto) {
  await archive(item.id);
  await fetchPassport(item.id);
}

async function onRestoreButtonClicked(item: DigitalProductDocumentDto) {
  await restore(item.id);
  await fetchPassport(item.id);
}

async function onPublishButtonClicked(item: DigitalProductDocumentDto) {
  await publish(item.id);
  await fetchPassport(item.id);
}
</script>

<template>
  <div v-if="dppItem" class="flex flex-col gap-3 p-4">
    <DigitalProductDocumentToolbar
      :dppItem="dppItem"
      :editorMode="AasEditMode.Passport"
      @on-publish-clicked="onPublishButtonClicked"
      @on-archive-clicked="onArchiveButtonClicked"
      @on-restore-clicked="onRestoreButtonClicked"
      @on-delete-clicked="onDeleteButtonClicked"
    />
    <AASEditor :id="dppItem.id" class="h-[calc(100vh-64px)]" :editor-mode="AasEditMode.Passport" />
  </div>
</template>
