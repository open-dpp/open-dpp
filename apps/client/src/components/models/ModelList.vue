<script lang="ts" setup>
import { computed, onMounted } from "vue";
import { useIndexStore } from "../../stores";
import { useModelsStore } from "../../stores/models";
import ListHeader from "../lists/ListHeader.vue";
import SimpleTable from "../lists/SimpleTable.vue";

const indexStore = useIndexStore();
const modelsStore = useModelsStore();

const rows = computed(() => {
  return modelsStore.models.map(m => ({
    id: m.id,
    uuid: m.uniqueProductIdentifiers[0].uuid,
    name: m.name,
  }));
});

const actions = [
  {
    name: "Artikelpässe",
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/models/${row.id}/items`,
  },
  {
    name: "Editieren",
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/models/${row.id}`,
  },
  {
    name: "QR-Code",
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
      creation-label="Modellpass hinzufügen"
      description="Alle Pässe auf der Produktmodellebene. Ein Produktmodell ist zum Beispiel das Galaxy S22 Ultra."
      title="Modellpässe"
    />
    <SimpleTable
      :headers="['ID', 'Name']"
      :ignore-row-keys="['id']"
      :row-actions="actions"
      :rows="rows"
    />
  </div>
</template>
