<script lang="ts" setup>
import type { TemplateDraftGetAllDto } from "@open-dpp/api-client";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import EmptyState from "../../components/models/EmptyState.vue";
import DraftsList from "../../components/template-drafts/DraftsList.vue";
import apiClient from "../../lib/api-client";
import { useIndexStore } from "../../stores";

const { t } = useI18n();
const indexStore = useIndexStore();
const fetchInFlight = ref(true);

const drafts = ref<TemplateDraftGetAllDto[]>([]);

onMounted(async () => {
  fetchInFlight.value = true;
  drafts.value = (await apiClient.dpp.templateDrafts.getAll()).data;
  fetchInFlight.value = false;
});
</script>

<template>
  <section>
    <div v-if="!fetchInFlight" class="flex flex-col gap-3 p-3">
      <DraftsList v-if="drafts.length > 0" :drafts="drafts" />
      <EmptyState
        v-else
        :button-link="`/organizations/${indexStore.selectedOrganization}/data-model-drafts/create`"
        :button-label="t('draft.createNewShort')"
      />
    </div>
  </section>
</template>
