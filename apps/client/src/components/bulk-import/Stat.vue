<script setup lang="ts">
const props = defineProps<{ label: string; value: string }>();
</script>
<template>
  <div class="bg-white px-4 py-6 sm:px-6 lg:px-8">
    <p class="text-sm/6 font-medium text-gray-500">{{ props.label }}</p>
    <p class="mt-2 flex items-baseline gap-x-2">
      <span class="text-4xl font-semibold tracking-tight text-gray-900">{{ props.value }}</span>
    </p>
  </div>
</template>
