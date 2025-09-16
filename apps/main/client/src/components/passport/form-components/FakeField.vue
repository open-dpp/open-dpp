<template>
  <div
    :class="[
      props.className,
      'group grow max-w-[20em] min-w-0 text-base mb-4 data-disabled:select-none data-disabled:opacity-50 data-disabled:pointer-events-none formkit-outer',
    ]"
    data-family="text"
    data-type="text"
    data-disabled="true"
    data-auto-animate="true"
    data-complete="true"
    style="position: relative"
    :data-cy="props.dataCy"
  >
    <div
      class="mb-1.5 flex flex-col items-start justify-start last:mb-0 formkit-wrapper"
    >
      <label
        class="block text-neutral-900 text-sm mb-1 dark:text-neutral-100 formkit-label"
        for="input_1"
        >{{ props.label }}</label
      >
      <div
        class="text-base w-full py-2 px-3 rounded-none border-neutral-900 items-center focus-within:ring-2 group-data-disabled:cursor-not-allowed! dark:border-neutral-100 formkit-inner block border-0 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300"
      >
        {{ props.placeholder }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  className?: string;
  label: string;
  placeholder: string;
  dataCy: string;
}>();
</script>
