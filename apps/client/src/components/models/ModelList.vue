<script lang="ts" setup>
import type {
  UniqueProductIdentifierDto,
} from "@open-dpp/api-client";
import { computed, onMounted } from "vue";
import { useIndexStore } from "../../stores";
import { useModelsStore } from "../../stores/models";
import ListHeader from "../lists/ListHeader.vue";
import SimpleTable from "../lists/SimpleTable.vue";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const indexStore = useIndexStore();
const modelsStore = useModelsStore();

const rows = computed(() => {
  return modelsStore.models.map(m => ({
    id: m.id,
    uuid: (m.uniqueProductIdentifiers[0] as UniqueProductIdentifierDto).uuid,
    name: m.name,
  }));
});

const actions = [
  {
    name: t('items.label'),
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/models/${row.id}/items`,
  },
  {
    name: t('common.edit'),
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/models/${row.id}`,
  },
  {
    name: t('common.qrCode'),
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/models/${row.id}/qr-code`,
  },
];

onMounted(async () => {
  await modelsStore.getModels();
});
</script>

<template>
  <div>
    <ListHeader
      :creation-link="`/organizations/${indexStore.selectedOrganization}/models/create`"
      :creation-label="t('models.list.creation-label')"
      :description="t('models.list.description')"
      :title="t('models.list.title')"
    />
    <SimpleTable
        :headers="[t('models.form.id'), t('models.form.name.label')]"
      :ignore-row-keys="['id']"
      :row-actions="actions"
      :rows="rows"
    />
  </div>
</template>
