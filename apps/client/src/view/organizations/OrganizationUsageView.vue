<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import Button from "primevue/button";
import ContentViewWrapper from "../ContentViewWrapper.vue";
import apiClient from "../../lib/api-client.ts";
import type { PolicyUtilizationDtoType } from "@open-dpp/dto";
import { onMounted, ref } from "vue";
import PolicyRule from "../../components/policy/PolicyRule.vue";
import { useInstanceSettings } from "../../composables/instance.settings.ts";
import { useIndexStore } from "../../stores/index.ts";

const policyUtilization = ref<PolicyUtilizationDtoType | undefined>(undefined);
const indexStore = useIndexStore();
const { usageManagementUrl, fetchInstanceSettings } = useInstanceSettings();

const { t } = useI18n();

onMounted(async () => {
  void fetchInstanceSettings();
  if (!indexStore.selectedOrganization) {
    return;
  }

  const response = await apiClient.dpp.policies.get(indexStore.selectedOrganization);
  policyUtilization.value = response.data;
});
</script>

<template>
  <ContentViewWrapper>
    <h3 class="py-2 text-xl leading-6 font-semibold text-gray-900">
      {{ t("organizations.usage.title") }}
    </h3>

    <div class="mt-8 flex max-w-96 flex-col gap-6">
      <PolicyRule
        v-if="policyUtilization"
        v-for="(policy, key) in policyUtilization"
        :policyKey="key"
        :usage="policy.used"
        :limit="policy.limit"
      />
      <div v-if="usageManagementUrl">
        <Button
          as="a"
          :href="usageManagementUrl"
          target="_blank"
          rel="noopener noreferrer"
          icon="pi pi-external-link"
          iconPos="right"
          :label="t('organizations.usage.manage')"
          data-testid="usage-management-link"
        />
      </div>
    </div>
  </ContentViewWrapper>
</template>
