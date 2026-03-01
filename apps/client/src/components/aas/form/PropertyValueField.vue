<script setup lang="ts">
import type { DataTypeDefType } from "@open-dpp/dto";
import { FloatLabel, InputGroup, Message } from "primevue";
import { useI18n } from "vue-i18n";
import PropertyValue from "../PropertyValue.vue";

const props = defineProps<{
  id: string;
  label: string;
  showError: boolean;
  error: string | undefined | null;
  modelValue: string | undefined | null;
  valueType?: DataTypeDefType;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | undefined | null): void;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-xl font-bold">{{ t("aasEditor.formLabels.value") }}</span>
    <InputGroup>
      <FloatLabel variant="on">
        <PropertyValue
          :id="props.id"
          :model-value="props.modelValue"
          :invalid="props.showError && !!props.error"
          :value-type="props.valueType"
          :disabled="props.disabled"
          @update:model-value="emit('update:modelValue', $event)"
        />
        <label :for="props.id">{{ props.label }}</label>
      </FloatLabel>
      <slot name="addon-right" />
    </InputGroup>
    <Message
      v-if="props.showError && props.error"
      size="small"
      severity="error"
      variant="simple"
    >
      {{ props.error }}
    </Message>
  </div>
</template>
