<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import ConnectionList from "../../components/integrations/ConnectionList.vue";
import EmptyState from "../../components/models/EmptyState.vue";
import { PRO_ALPHA_INTEGRATION_ID } from "../../const";
import { useIndexStore } from "../../stores";
import { useAasConnectionStore } from "../../stores/aas.connection";

const { t } = useI18n();
const fetchInFlight = ref(true);

const aasIntegrationStore = useAasConnectionStore();
const indexStore = useIndexStore();

onMounted(async () => {
  fetchInFlight.value = true;
  await aasIntegrationStore.fetchConnections();
  fetchInFlight.value = false;
});
</script>

<template>
  <section>
    <div v-if="!fetchInFlight" class="flex flex-col gap-3 p-3">
      <ConnectionList v-if="aasIntegrationStore.aasConnections.length > 0" />
      <EmptyState
        v-else
        :button-link="`/organizations/${indexStore.selectedOrganization}/integrations/${PRO_ALPHA_INTEGRATION_ID}/connections/create`"
        :button-label="t('integrations.connections.new')"
      />
    </div>
  </section>
</template>
