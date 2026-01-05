<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import DppTable from "../../components/DppTable.vue";
import { useTemplatesStore } from "../../stores/templates.ts";

const templateStore = useTemplatesStore();
const { t } = useI18n();
</script>

<template>
  <DppTable :items="[]" :title="t('templates.label')" @create="templateStore.createTemplate" />
</template>
