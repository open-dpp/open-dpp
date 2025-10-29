<script lang="ts" setup>
import type { DataFieldDto, SectionDto } from "@open-dpp/api-client";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/vue/20/solid";
import { useI18n } from "vue-i18n";
import { DraftDataFieldVisualization } from "../../../lib/draft.ts";
import { useDraftStore } from "../../../stores/draft";

const props = defineProps<{ dataField: DataFieldDto; section: SectionDto }>();
const emits = defineEmits<{
  (e: "clicked"): void;
}>();

const { t } = useI18n();

const draftStore = useDraftStore();

function isFirst(id: string) {
  return props.section.dataFields.findIndex(s => s.id === id) === 0;
}

function isLast(id: string) {
  const idx = props.section.dataFields.findIndex(s => s.id === id);
  return idx === props.section.dataFields.length - 1;
}
</script>

<template>
  <div class="flex gap-2 items-center">
    <div
      class="flex size-8 w-48 gap-1 p-1 items-center justify-center rounded-md" :class="[
        DraftDataFieldVisualization[props.dataField.type].background,
      ]"
    >
      <component
        :is="DraftDataFieldVisualization[props.dataField.type].icon"
        aria-hidden="true"
        class="size-6 text-white"
      />
      <div class="w-40 text-white cursor-pointer" @mousedown.prevent="emits('clicked')">
        {{ t(DraftDataFieldVisualization[props.dataField.type].label) }}
      </div>
    </div>

    <input
      :placeholder="dataField.name"
      class="block w-full cursor-pointer select-none rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 sm:text-sm sm:leading-6"
      readonly
      type="text"
      @mousedown.prevent="emits('clicked')"
    >
    <div class="flex items-center rounded-md">
      <button
        type="button"
        :data-cy="`move-data-field-${dataField.id}-up`"
        :disabled="isFirst(dataField.id)"
        :aria-disabled="isFirst(dataField.id)"
        class="inline-flex items-center justify-center rounded-l-md bg-white px-1 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 disabled:opacity-50 disabled:pointer-events-none"
        @click="draftStore.moveDataFieldUp(dataField.id)"
      >
        <span class="sr-only">Datenfeld nach oben verschieben</span>
        <ChevronUpIcon class="size-7" aria-hidden="true" />
      </button>
      <button
        type="button"
        :data-cy="`move-data-field-${dataField.id}-down`"
        :disabled="isLast(dataField.id)"
        :aria-disabled="isLast(dataField.id)"
        class="inline-flex items-center justify-center rounded-r-md bg-white px-1 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 disabled:opacity-50 disabled:pointer-events-none"
        @click="draftStore.moveDataFieldDown(dataField.id)"
      >
        <span class="sr-only">Datenfeld nach unten verschieben</span>
        <ChevronDownIcon class="size-7" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
