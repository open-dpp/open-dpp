<script setup lang="ts">
const { url = "/api/branding/instance" } = defineProps<{
  url?: string;
}>();
</script>

<template>
  <img
    class="mx-auto h-16 w-auto"
    :src="url"
    alt="brand-image"
  >
</template>
