<script setup lang="ts">
import type { PolicyKey } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { policyKey } = defineProps<{
  policyKey: PolicyKey;
}>();

const limit = defineModel<number>({ required: true });
const { t, locale } = useI18n();

const tKey = computed(() => `organizations.usage.policy.${policyKey}`);
const title = computed(() => t(`${tKey.value}.title`));
const description = computed(() => t(`${tKey.value}.description`));
const unit = computed(() => " " + t(`${tKey.value}.unit`, limit.value));
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xs flex-col gap-1.5">
    <label for="basic-inputnumber">{{ title }}</label>
    <InputNumber
      v-model="limit"
      inputId="basic-inputnumber"
      :suffix="unit"
      showButtons
      :locale="locale"
    />
    <small class="text-surface-500">{{ description }}</small>
  </div>
</template>
