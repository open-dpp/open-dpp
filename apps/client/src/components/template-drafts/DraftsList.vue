<template>
  <div class="">
    <ListHeader
      title="Passvorlagen Entwürfe"
      description="Alle Passvorlagen Entwürfe."
      :creation-link="`/organizations/${indexStore.selectedOrganization}/data-model-drafts/create`"
      creation-label="Passvorlage entwerfen"
    />
    <SimpleTable
      :headers="['Name']"
      :rows="rows"
      :row-actions="actions"
      :ignoreRowKeys="['id']"
    />
  </div>
</template>

<script lang="ts" setup>
import { useIndexStore } from '../../stores';
import ListHeader from '../lists/ListHeader.vue';
import { computed } from 'vue';
import SimpleTable from '../lists/SimpleTable.vue';
import { TemplateDraftGetAllDto } from '@open-dpp/api-client';

const indexStore = useIndexStore();

const props = defineProps<{
  drafts: TemplateDraftGetAllDto[];
}>();

const rows = computed(() => {
  return props.drafts.map((d) => ({ id: d.id, name: d.name }));
});

const actions = [
  {
    name: 'Editieren',
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/data-model-drafts/${row.id}`,
  },
];
</script>
