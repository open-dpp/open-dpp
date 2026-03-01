<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import DppTable from "../../components/DppTable.vue";
import TemplateCreateDialog from "../../components/template/TemplateCreateDialog.vue";
import { useTemplates } from "../../composables/templates.ts";

const route = useRoute();
const router = useRouter();

function changeQueryParams(newQuery: Record<string, string | undefined>) {
  router.replace({
    query: {
      ...route.query,
      ...newQuery,
    },
  });
}

const {
  createTemplate,
  resetCursor,
  hasPrevious,
  hasNext,
  previousPage,
  nextPage,
  currentPage,
  templates,
  loading,
  init,
} = useTemplates({
  changeQueryParams,
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
});
const { t } = useI18n();

const createDialogVisible = ref(false);

onMounted(async () => {
  await init();
});
</script>

<template>
  <DppTable
    key="templates-list"
    :has-previous="hasPrevious"
    :has-next="hasNext"
    :current-page="currentPage"
    :items="templates ? templates.result : []"
    :loading="loading"
    :title="t('templates.label')"
    :uses-templates="true"
    @reset-cursor="resetCursor"
    @create="createDialogVisible = true"
    @next-page="nextPage"
    @previous-page="previousPage"
  />
  <TemplateCreateDialog v-if="createDialogVisible" v-model="createDialogVisible" :create-template="createTemplate" />
</template>
