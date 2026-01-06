<script lang="ts" setup>
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import DppTable from "../../components/DppTable.vue";
import { useTemplatesStore } from "../../stores/templates.ts";

const templateStore = useTemplatesStore();
const { t } = useI18n();

onMounted(async () => {
  await templateStore.nextTemplates();
});
</script>

<template>
  <DppTable
    :current-page="templateStore.currentPage"
    :items="templateStore.templates ? templateStore.templates.result : []"
    :loading="templateStore.loading"
    :title="t('templates.label')"
    @create="templateStore.createTemplate"
    @next-page="templateStore.nextTemplates"
    @previous-page="templateStore.previousTemplates"
  />
</template>
