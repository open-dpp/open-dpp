<script setup lang="ts">
import type { DataTypeDefType } from "@open-dpp/dto";
import { DataTypeDef, isIntegerDataType, isNumericDataType } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import { formatDateValueForModel, parseDateValueFromModel } from "../../lib/date-value.ts";

const props = defineProps<{
  id: string;
  modelValue: string | undefined | null;
  invalid?: boolean;
  valueType?: DataTypeDefType;
  disabled?: boolean;
  ariaDescribedby?: string;
  ariaInvalid?: "true" | "false" | undefined;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | undefined | null): void;
}>();

const { locale } = useI18n();

const isNumeric = computed(() => isNumericDataType(props.valueType));

const isDate = computed(() => props.valueType === DataTypeDef.Date);

const isDateTime = computed(() => props.valueType === DataTypeDef.DateTime);

const maxFractionDigits = computed(() => (isIntegerDataType(props.valueType) ? 0 : 5));

const numericValue = computed({
  get: () => {
    try {
      return z.coerce.number().nullish().parse(props.modelValue);
    } catch {
      return null;
    }
  },
  set: (v) => emit("update:modelValue", z.coerce.string().nullish().parse(v)),
});

const dateValue = computed({
  get: () => parseDateValueFromModel(props.modelValue),
  set: (v: Date | null | undefined) => {
    if (!props.valueType) {
      emit("update:modelValue", null);
      return;
    }
    emit("update:modelValue", formatDateValueForModel(v ?? null, props.valueType));
  },
});

const textValue = computed({
  get: () => z.coerce.string().nullish().parse(props.modelValue),
  set: (v) => {
    const newValue = z.coerce.string().nullish().parse(v);
    emit("update:modelValue", newValue === "" ? null : newValue);
  },
});
</script>

<template>
  <InputNumber
    v-if="isNumeric"
    :id="props.id"
    v-model="numericValue"
    :disabled="props.disabled"
    :invalid="props.invalid"
    :locale="locale"
    :max-fraction-digits="maxFractionDigits"
    :aria-describedby="props.ariaDescribedby"
    :aria-invalid="props.ariaInvalid"
    show-buttons
  />
  <DatePicker
    v-else-if="isDate || isDateTime"
    :id="props.id"
    v-model="dateValue"
    :disabled="props.disabled"
    :invalid="props.invalid"
    :show-time="isDateTime"
    :show-seconds="isDateTime"
    :aria-describedby="props.ariaDescribedby"
    :aria-invalid="props.ariaInvalid"
    show-icon
    icon-display="input"
    fluid
  />
  <Textarea
    v-else
    :id="props.id"
    v-model="textValue"
    :disabled="props.disabled"
    :invalid="props.invalid"
    :aria-describedby="props.ariaDescribedby"
    :aria-invalid="props.ariaInvalid"
    fluid
  />
</template>

<style scoped></style>
