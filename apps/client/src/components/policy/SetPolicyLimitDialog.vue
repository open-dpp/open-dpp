<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client.ts";
import {
  PolicyKeyList,
  type PolicyUtilizationDtoType,
  type SetPolicyLimitsDto,
} from "@open-dpp/dto";
import LimitInput from "./LimitInput.vue";

const emit = defineEmits<{
  (e: "success"): void;
}>();

const { t } = useI18n();
const visible = ref(false);
const loading = ref(false);
const errors = ref<Array<string>>([]);
const success = ref(false);
const organizationId = ref<string | null>(null);
const policyLimits = ref<PolicyUtilizationDtoType | null>(null);

async function openDialog(orgaId: string) {
  organizationId.value = orgaId;
  success.value = false;
  visible.value = true;
  errors.value = [];

  const response = await apiClient.dpp.policies.get(orgaId);
  policyLimits.value = response.data;
}

async function submit() {
  if (!policyLimits.value || !organizationId.value) {
    return;
  }

  const limitUpdate: SetPolicyLimitsDto = {};
  for (const key of Object.values(PolicyKeyList)) {
    limitUpdate[key] = policyLimits.value[key].limit;
  }

  try {
    loading.value = true;
    if (Object.keys(limitUpdate).length > 0) {
      await apiClient.dpp.policies.setLimits(organizationId.value, limitUpdate);
    }
    visible.value = false;
  } finally {
    loading.value = false;
  }
}

defineExpose({
  openDialog,
});
</script>

<template>
  <Dialog modal v-model:visible="visible" :header="t('organizations.usage.setLimitsDialog.title')">
    <form @submit.prevent="submit">
      <small class="text-surface-500">{{
        t("organizations.usage.setLimitsDialog.nullIsUnlimited")
      }}</small>
      <LimitInput
        class="mt-5"
        v-if="policyLimits"
        v-for="(rule, key) in policyLimits"
        :policy-key="key"
        v-model="rule.limit"
      />
      <div class="mt-4 flex w-full flex-col items-end">
        <Button type="submit" :disabled="loading">
          {{ t("common.save") }}
        </Button>
      </div>
    </form>
  </Dialog>
</template>
