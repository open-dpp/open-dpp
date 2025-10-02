<script lang="ts" setup>
import type { SectionDto } from "@open-dpp/api-client";
import { computed } from "vue";
import { useDraftStore } from "../../stores/draft";
import DataFieldDraft from "./DataFieldDraft.vue";

const props = defineProps<{
  section: SectionDto;
}>();

const draftStore = useDraftStore();

const subSections = computed<SectionDto[]>(() =>
  props.section.subSections
    .map(sid => draftStore.findSectionById(sid))
    .filter(s => s !== undefined),
);
</script>

<template>
  <div
    v-if="props.section"
    :data-cy="props.section.id"
    class="grid gap-1 p-0.5"
  >
    <DataFieldDraft
      v-for="dataField of props.section.dataFields"
      :key="dataField.id"
      :data-cy="dataField.id"
      :data-field="dataField"
      :section="props.section"
    />
    <SectionDraft
      v-for="subSection of subSections"
      :key="subSection.id"
      :section="subSection"
    />
  </div>
</template>
