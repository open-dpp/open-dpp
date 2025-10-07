<script lang="ts" setup>
import { onMounted, ref } from "vue";
import EmptyState from "../../components/models/EmptyState.vue";
import ModelList from "../../components/models/ModelList.vue";
import { useIndexStore } from "../../stores";
import { useModelsStore } from "../../stores/models";
import { useI18n } from 'vue-i18n';

const modelsStore = useModelsStore();
const indexStore = useIndexStore();
const { t } = useI18n();
const fetchInFlight = ref(true);
const selectedProductId = ref<string>();

async function onSelect(productId: string) {
  selectedProductId.value = productId;
}

onMounted(async () => {
  fetchInFlight.value = true;
  await modelsStore.getModels();
  fetchInFlight.value = false;
});
</script>

<template>
  <section>
    <div v-if="!fetchInFlight" class="flex flex-col gap-3 p-3">
      <ModelList v-if="modelsStore.models.length > 0" @edit="onSelect" />
      <EmptyState
        v-else
        :button-link="`/organizations/${indexStore.selectedOrganization}/models/create`"
        :button-label="t('models.createPass')"
      />
    </div>
  </section>
</template>
