<script setup lang="ts">
const props = defineProps<{ dt: string }>();
</script>

<template>
  <div>
    <dt class="text-sm/6 font-medium text-gray-900">{{ props.dt }}</dt>
    <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
      <slot></slot>
    </dd>
  </div>
</template>

<style scoped></style>
