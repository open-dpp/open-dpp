<script setup lang="ts">
import { DppStatusDto, type DppStatusDtoType } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";

const model = defineModel<DppStatusDtoType>();
const { t } = useI18n();
const options = Object.entries(DppStatusDto).map(([key, value]) => ({
  key,
  value: t(`status.${value.toLowerCase()}`),
}));
</script>

<template>
  <Select
    v-model="model"
    :options="options"
    option-label="value"
    option-value="key"
    placeholder="Select a Status"
    class="w-42"
  />
</template>
