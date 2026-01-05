<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import DppTableView from "./DppTableView.vue";

const { t } = useI18n();
</script>

<template>
  <DppTableView :items="[]" :title="t('templates.label')" />
</template>
