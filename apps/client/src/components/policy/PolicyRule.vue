<script setup lang="ts">
import { type PolicyKey } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const {
  policyKey: key,
  limit,
  usage,
} = defineProps<{
  policyKey: PolicyKey;
  limit: number;
  usage: number;
}>();

const { t } = useI18n();

const value = computed(() => {
  if (limit === 0) {
    return 0;
  }

  return (usage / limit) * 100;
});

const unitKey = computed(() => `organizations.usage.policy.${key}.unit`);

const limitText = computed(() => {
  if (limit === 0) {
    return "∞";
  }

  return limit;
});
</script>

<template>
  <div>
    <div class="mb-3 flex items-center justify-between text-sm">
      <span class="font-medium">
        {{ t(`organizations.usage.policy.${key}.title`) }}
      </span>
      <span
        >{{ usage }} {{ t(unitKey, usage) }} / {{ limitText }}
        {{ t(unitKey, limit === 0 ? 10 : limit) }}</span
      >
    </div>
    <ProgressBar :value="value" :showValue="false" />
  </div>
</template>
