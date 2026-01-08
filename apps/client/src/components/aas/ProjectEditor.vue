<script setup lang="ts">
interface Project {
  id: string;
  name: string;
  visibility: "public" | "private";
}
defineProps<{
  data: Project;
}>();
</script>

<template>
  <div>
    Project
  </div>
</template>

<style scoped>

</style>
