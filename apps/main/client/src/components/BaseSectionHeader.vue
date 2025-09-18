<template>
  <div
    class="flex justify-between items-center border-b border-gray-900/5 bg-gray-50"
  >
    <div class="flex items-center gap-2">
      <div
        :class="[
          props.section.type === SectionType.REPEATABLE
            ? 'bg-pink-500'
            : 'bg-indigo-500',
          'flex size-16 items-center justify-center',
        ]"
      >
        <component
          :is="
            props.section.type === SectionType.REPEATABLE
              ? ArrowPathIcon
              : TableCellsIcon
          "
          class="size-6 text-white"
          aria-hidden="true"
        />
      </div>
      <div class="text-sm/6 font-medium text-gray-900">
        {{ props.section.name }}
      </div>
    </div>
    <slot name="actions"></slot>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon, TableCellsIcon } from '@heroicons/vue/24/outline';
import { SectionDto, SectionType } from '@open-dpp/api-client';

const props = defineProps<{
  section: SectionDto;
}>();
</script>
