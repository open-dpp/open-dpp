<template>
  <div class="">
    <ListHeader
      :title="t('draft.passportDraft')"
      :description="t('draft.passportDraftDescription')"
      :creation-link="`/organizations/${indexStore.selectedOrganization}/data-model-drafts/create`"
      :creation-label="t('draft.createDraft')"
    />
    <SimpleTable
      :headers="[t('draft.form.name.label')]"
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
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const indexStore = useIndexStore();

const props = defineProps<{
  drafts: TemplateDraftGetAllDto[];
}>();

const rows = computed(() => {
  return props.drafts.map((d) => ({ id: d.id, name: d.name }));
});

const actions = [
  {
    name: t('draft.edit'),
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/data-model-drafts/${row.id}`,
  },
];
</script>
