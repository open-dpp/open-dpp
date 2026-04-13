<script setup lang="ts">
import type { DataTypeDefType } from "@open-dpp/dto";
import { DataTypeDef } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { getCurrentTimezone } from "../../../lib/date-value.ts";
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

const isDateOrDateTime = computed(
  () =>
    props.valueType === DataTypeDef.Date
    || props.valueType === DataTypeDef.DateTime,
);
const currentTimezone = computed(() => getCurrentTimezone());
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
    <small
      v-if="isDateOrDateTime"
      class="text-muted-color"
      data-testid="property-value-timezone"
    >
      {{ t("aasEditor.timezone") }}: {{ currentTimezone }}
    </small>
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
