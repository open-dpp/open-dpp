<script setup lang="ts">
interface Issue {
  id: string;
  title: string;
  assigneeId?: string;
}
defineProps<{
  data: Issue;
}>();
</script>

<template>
  <div>
    Issue
  </div>
</template>

<style scoped>

</style>
