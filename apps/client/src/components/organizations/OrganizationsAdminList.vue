<script lang="ts" setup>
import type { Organization } from "better-auth/client";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useIndexStore } from "../../stores";
import ListHeader from "../lists/ListHeader.vue";
import SimpleTable from "../lists/SimpleTable.vue";

const props = defineProps<{
  organizations: Organization[];
}>();

const emits = defineEmits<{
  (e: "add"): void;
}>();

const { t } = useI18n();

const indexStore = useIndexStore();
const route = useRoute();

const rows = computed(() => {
  return props.organizations.map(i => ({
    id: i.id,
  }));
});

const actions = [
  {
    name: t("common.edit"),
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/models/${route.params.modelId as string}/items/${row.id}`,
  },
  {
    name: t("common.qrCode"),
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/models/${route.params.modelId as string}/items/${row.id}/qr-code`,
  },
];
</script>

<template>
  <div>
    <ListHeader
      creation-label="Add organization"
      description="Alle Pässe auf Einzelartikelebene."
      title="Organizations"
      @add="emits('add')"
    />
    <SimpleTable
      :headers="['ID']"
      :ignore-row-keys="['id']"
      :row-actions="[]"
      :rows="rows"
    />
  </div>
</template>
