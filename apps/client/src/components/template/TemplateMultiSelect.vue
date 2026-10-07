<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useTemplateOptions } from "../../composables/template-options.ts";
import TemplateSelectOption from "./TemplateSelectOption.vue";

const { disabled = false } = defineProps<{
  disabled?: boolean;
}>();

const model = defineModel<string[]>({ default: () => [] });

const { t } = useI18n();
const { selectProps } = useTemplateOptions(() => disabled);
</script>

<template>
  <MultiSelect
    v-model="model"
    v-bind="selectProps"
    display="chip"
    :show-toggle-all="false"
    :placeholder="t('templates.selectMultiple')"
  >
    <template #option="slotProps">
      <TemplateSelectOption :option="slotProps.option" />
    </template>
  </MultiSelect>
</template>
