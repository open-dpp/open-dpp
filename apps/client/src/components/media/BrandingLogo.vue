<script setup lang="ts">
const { url = "/api/branding/instance", center = true } = defineProps<{
  url?: string;
  center?: boolean;
}>();
</script>

<template>
  <img class="h-16 w-auto" :class="{ 'mx-auto': center }" :src="url" alt="brand-image" />
</template>
