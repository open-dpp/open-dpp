<script lang="ts" setup>
import type { TemplateDraftGetAllDto } from "@open-dpp/api-client";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useIndexStore } from "../../stores";
import ListHeader from "../lists/ListHeader.vue";
import SimpleTable from "../lists/SimpleTable.vue";

const props = defineProps<{
  drafts: TemplateDraftGetAllDto[];
}>();
const { t } = useI18n();
const indexStore = useIndexStore();

const rows = computed(() => {
  return props.drafts.map(d => ({ id: d.id, name: d.name }));
});

const actions = [
  {
    name: t("draft.edit"),
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/data-model-drafts/${row.id}`,
  },
];
</script>

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
      :ignore-row-keys="['id']"
    />
  </div>
</template>
