<template>
  <section>
    <div v-if="!fetchInFlight" class="flex flex-col gap-3 p-3">
      <ModelList v-if="modelsStore.models.length > 0" @edit="onSelect" />
      <EmptyState
        v-else
        :button-link="`/organizations/${indexStore.selectedOrganization}/models/create`"
        button-label="Neuen Modellpass hinzufügen"
      />
    </div>
  </section>
</template>
<script lang="ts" setup>
import ModelList from "../../components/models/ModelList.vue";
import { onMounted, ref } from "vue";
import { useModelsStore } from "../../stores/models";
import EmptyState from "../../components/models/EmptyState.vue";
import { useIndexStore } from "../../stores";

const modelsStore = useModelsStore();
const indexStore = useIndexStore();
const fetchInFlight = ref(true);
const selectedProductId = ref<string>();

const onSelect = async (productId: string) => {
  selectedProductId.value = productId;
};

onMounted(async () => {
  fetchInFlight.value = true;
  await modelsStore.getModels();
  fetchInFlight.value = false;
});
</script>
