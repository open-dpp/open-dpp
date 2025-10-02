<script lang="ts" setup>
import type { ItemDto } from "@open-dpp/api-client";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useIndexStore } from "../../stores";
import ListHeader from "../lists/ListHeader.vue";
import SimpleTable from "../lists/SimpleTable.vue";

const props = defineProps<{
  items: ItemDto[];
}>();

const emits = defineEmits<{
  (e: "add"): void;
}>();

const indexStore = useIndexStore();

const route = useRoute();

const rows = computed(() => {
  return props.items.map(i => ({
    id: i.id,
    uuid: i.uniqueProductIdentifiers[0].uuid,
  }));
});

const actions = [
  {
    name: "Editieren",
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/models/${route.params.modelId as string}/items/${row.id}`,
  },
  {
    name: "QR-Code",
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/models/${route.params.modelId as string}/items/${row.id}/qr-code`,
  },
];
</script>

<template>
  <div>
    <ListHeader
      creation-label="Artikelpass hinzufügen"
      description="Alle Pässe auf Einzelartikelebene."
      title="Artikelpässe"
      @add="emits('add')"
    />
    <SimpleTable
      :headers="['ID']"
      :ignore-row-keys="['id']"
      :row-actions="actions"
      :rows="rows"
    />
  </div>
</template>
