<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useTemplateOptions } from "../../composables/template-options.ts";

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
      <div class="flex items-center gap-2">
        <div class="text-xl">{{ slotProps.option.label }}</div>
        <Tag severity="secondary" :value="slotProps.option.status" />
      </div>
    </template>
  </MultiSelect>
</template>
