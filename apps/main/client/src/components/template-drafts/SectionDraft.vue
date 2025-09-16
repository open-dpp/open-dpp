<template>
  <div
    v-if="props.section"
    :data-cy="props.section.id"
    :class="['grid gap-1 p-0.5']"
  >
    <DataFieldDraft
      v-for="dataField of props.section.dataFields"
      :key="dataField.id"
      :data-cy="dataField.id"
      :data-field="dataField"
      :section="props.section"
    />
    <SectionDraft
      v-for="section of subSections"
      :key="section.id"
      :section="section"
    />
  </div>
</template>

<script lang="ts" setup>
import { useDraftStore } from "../../stores/draft";
import { SectionDto } from "@open-dpp/api-client";
import DataFieldDraft from "./DataFieldDraft.vue";
import { computed } from "vue";

const props = defineProps<{
  section: SectionDto;
}>();

const draftStore = useDraftStore();

const subSections = computed<SectionDto[]>(() =>
  props.section.subSections
    .map((sid) => draftStore.findSectionById(sid))
    .filter((s) => s !== undefined),
);
</script>
