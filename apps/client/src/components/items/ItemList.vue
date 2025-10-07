<script lang="ts" setup>
import type { ItemDto, UniqueProductIdentifierDto } from "@open-dpp/api-client";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useIndexStore } from "../../stores";
import ListHeader from "../lists/ListHeader.vue";
import SimpleTable from "../lists/SimpleTable.vue";
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const indexStore = useIndexStore();
const route = useRoute();

const props = defineProps<{
  items: ItemDto[];
}>();

const emits = defineEmits<{
  (e: "add"): void;
}>();

const rows = computed(() => {
  return props.items.map(i => ({
    id: i.id,
    uuid: (i.uniqueProductIdentifiers[0] as UniqueProductIdentifierDto).uuid,
  }));
});

const actions = [
  {
    name: t('common.edit'),
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/models/${route.params.modelId as string}/items/${row.id}`,
  },
  {
    name: t('common.qrCode'),
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
