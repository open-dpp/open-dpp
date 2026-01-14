<script setup lang="ts">
import { Language } from "@open-dpp/dto";
import { Select } from "primevue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const model = defineModel();

const { t } = useI18n();

const languageOptions = computed(() => {
  return [
    { name: t("languages.english"), language: Language.en },
    { name: t("languages.german"), language: Language.de },
  ];
},
);
</script>

<template>
  <Select v-model="model" :options="languageOptions" option-value="language" option-label="name" placeholder="Select a Language" />
</template>

<style scoped>

</style>
