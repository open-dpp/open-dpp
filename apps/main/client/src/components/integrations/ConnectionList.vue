<template>
  <ListHeader
    title="Verbindungen"
    description="Alle Ihre Verbindungen"
    creation-label="Verbindung erstellen"
    :creation-link="`/organizations/${indexStore.selectedOrganization}/integrations/${PRO_ALPHA_INTEGRATION_ID}/connections/create`"
  />
  <SimpleTable :headers="['ID', 'Name']" :rows="rows" :row-actions="actions" />
</template>

<script setup lang="ts">
import ListHeader from "../lists/ListHeader.vue";
import SimpleTable from "../lists/SimpleTable.vue";
import { computed, onMounted } from "vue";
import { useAasConnectionStore } from "../../stores/aas.connection";
import { useIndexStore } from "../../stores";
import { PRO_ALPHA_INTEGRATION_ID } from "../../const";
import { AasConnectionGetAllDto } from "@open-dpp/api-client";

const aasIntegrationStore = useAasConnectionStore();
const indexStore = useIndexStore();
const rows = computed(() => {
  return aasIntegrationStore.aasConnections.map(
    (c: AasConnectionGetAllDto) => ({
      id: c.id,
      name: c.name,
    }),
  );
});

const actions = [
  {
    name: "Editieren",
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/integrations/pro-alpha/connections/${row.id}`,
  },
];

onMounted(async () => {
  await aasIntegrationStore.fetchConnections();
});
</script>
