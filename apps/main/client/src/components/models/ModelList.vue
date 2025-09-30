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

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useModelsStore } from '../../stores/models';
import { useIndexStore } from '../../stores';
import SimpleTable from '../lists/SimpleTable.vue';
import ListHeader from '../lists/ListHeader.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const indexStore = useIndexStore();
const modelsStore = useModelsStore();

const rows = computed(() => {
  return modelsStore.models.map((m) => ({
    id: m.id,
    uuid: m.uniqueProductIdentifiers[0].uuid,
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
