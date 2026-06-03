<script setup lang="ts">
const props = defineProps<{
  idShort: string;
}>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <div><span class="font-bold">ID:</span> {{ props.idShort }}</div>
  </div>
</template>
