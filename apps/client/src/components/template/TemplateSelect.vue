<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useTemplateOptions } from "../../composables/template-options.ts";
import TemplateSelectOption from "./TemplateSelectOption.vue";

const { disabled = false } = defineProps<{
  disabled?: boolean;
}>();

const model = defineModel<string | null>();

const { t } = useI18n();
const { selectProps } = useTemplateOptions(() => disabled);
</script>

<template>
  <Select v-model="model" v-bind="selectProps" :placeholder="t('templates.select')">
    <template #option="slotProps">
      <TemplateSelectOption :option="slotProps.option" />
    </template>
  </Select>
</template>
