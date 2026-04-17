<script setup lang="ts">
import {
  DigitalProductDocumentStatusDto,
  type DigitalProductDocumentStatusDtoType,
} from "@open-dpp/dto";
import { useI18n } from "vue-i18n";

const model = defineModel<DigitalProductDocumentStatusDtoType>();
const { t } = useI18n();
const options = Object.entries(DigitalProductDocumentStatusDto).map(([key, value]) => ({
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
