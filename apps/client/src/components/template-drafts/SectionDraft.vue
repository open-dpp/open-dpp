<script lang="ts" setup>
import type { SectionDto } from "@open-dpp/api-client";
import DataFieldDraft from "./DataFieldDraft.vue";

const props = defineProps<{
  section: SectionDto;
}>();
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
  </div>
</template>
