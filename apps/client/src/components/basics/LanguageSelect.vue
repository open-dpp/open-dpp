<script setup lang="ts">
import { Language } from "@open-dpp/dto";
import { Select } from "primevue";
import { ref } from "vue";

const model = defineModel();

const languageOptions = ref([
  { name: "English", language: Language.en },
  { name: "Deutsch", language: Language.de },
]);
</script>

<template>
  <Select v-model="model" :options="languageOptions" option-value="language" option-label="name" placeholder="Select a Language" />
</template>

<style scoped>

</style>
