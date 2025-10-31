<script lang="ts" setup>
import type { DataFieldDto, SectionDto } from "@open-dpp/api-client";
import { DataFieldType, GranularityLevel } from "@open-dpp/api-client";
import { Button, Column, DataTable, Tag } from "primevue";
import { useI18n } from "vue-i18n";
import { z } from "zod/v4";
import { DraftDataFieldVisualization } from "../../lib/draft.ts";
import { useDraftStore } from "../../stores/draft.ts";
import { SidebarContentType, useDraftSidebarStore } from "../../stores/draftSidebar.ts";

const props = defineProps<{
  section: SectionDto;
}>();
const { t } = useI18n();
const draftSidebarStore = useDraftSidebarStore();
const draftStore = useDraftStore();

function getTagContent(type: DataFieldType) {
  const visualization = DraftDataFieldVisualization[z.enum(DataFieldType).parse(type)];
  return { value: t(visualization.label), bgColor: visualization.background };
}

function onEdit(dataField: DataFieldDto) {
  draftSidebarStore.open(SidebarContentType.DATA_FIELD_FORM, {
    type: dataField.type,
    id: dataField.id,
  });
}
function isFirst(id: string) {
  return props.section.dataFields.findIndex(s => s.id === id) === 0;
}

function isLast(id: string) {
  const idx = props.section.dataFields.findIndex(s => s.id === id);
  return idx === props.section.dataFields.length - 1;
}
</script>

<template>
  <div
    v-if="props.section"
    :data-cy="props.section.id"
    class="grid gap-1 p-0.5"
  >
    <DataTable :value="props.section.dataFields" table-style="min-width: 50rem">
      <Column header="Name">
        <template #body="slotProps">
          <p :data-cy="slotProps.data.id">
            {{ slotProps.data.name }}
          </p>
        </template>
      </Column>
      <Column field="type" :header="t('builder.dataFieldType')">
        <template #body="slotProps">
          <Tag
            class="!text-white" :class="[`!${getTagContent(slotProps.data.type).bgColor}`]"
            :value="getTagContent(slotProps.data.type).value"
          />
        </template>
      </Column>
      <Column field="granularityLevel" :header="t('builder.granularityLevel')">
        <template #body="slotProps">
          <p>{{ slotProps.data.granularityLevel === GranularityLevel.MODEL ? t('builder.granularity.model') : t('builder.granularity.item') }}</p>
        </template>
      </Column>
      <Column class="w-24 !text-end">
        <template #body="{ data }">
          <div class="flex items-center rounded-md gap-2">
            <Button icon="pi pi-pencil" :data-cy="`edit-${data.id}`" severity="primary" rounded @click="onEdit(data)" />
            <Button icon="pi pi-chevron-up" :data-cy="`move-data-field-${data.id}-up`" severity="secondary" :disabled="isFirst(data.id)" rounded @click="draftStore.moveDataFieldUp(data.id)" />
            <Button icon="pi pi-chevron-down" :data-cy="`move-data-field-${data.id}-down`" severity="secondary" :disabled="isLast(data.id)" rounded @click="draftStore.moveDataFieldDown(data.id)" />
          </div>
        </template>
      </Column>
    </datatable>
  </div>
</template>
