<template>
  <div class="flex gap-2">
    <input
      :placeholder="dataField.name"
      class="block w-full cursor-pointer select-none rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 sm:text-sm sm:leading-6"
      readonly
      type="text"
      @mousedown.prevent="emits('clicked')"
    />
    <div class="flex items-center rounded-md">
      <button
        type="button"
        :data-cy="`move-data-field-${dataField.id}-up`"
        @click="draftStore.moveDataFieldUp(dataField.id)"
        :disabled="isFirst(dataField.id)"
        :aria-disabled="isFirst(dataField.id)"
        class="inline-flex items-center justify-center rounded-l-md bg-white px-1 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 disabled:opacity-50 disabled:pointer-events-none"
      >
        <span class="sr-only">Datenfeld nach oben verschieben</span>
        <ChevronUpIcon class="size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        :data-cy="`move-data-field-${dataField.id}-down`"
        @click="draftStore.moveDataFieldDown(dataField.id)"
        :disabled="isLast(dataField.id)"
        :aria-disabled="isLast(dataField.id)"
        class="inline-flex items-center justify-center rounded-r-md bg-white px-1 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 disabled:opacity-50 disabled:pointer-events-none"
      >
        <span class="sr-only">Datenfeld nach unten verschieben</span>
        <ChevronDownIcon class="size-5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { DataFieldDto, SectionDto } from "@open-dpp/api-client";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/vue/20/solid";
import { useDraftStore } from "../../../stores/draft";

const props = defineProps<{ dataField: DataFieldDto; section: SectionDto }>();

const draftStore = useDraftStore();

const isFirst = (id: string) =>
  props.section.dataFields.findIndex((s) => s.id === id) === 0;

const isLast = (id: string) => {
  const idx = props.section.dataFields.findIndex((s) => s.id === id);
  return idx === props.section.dataFields.length - 1;
};

const emits = defineEmits<{
  (e: "clicked"): void;
}>();
</script>
