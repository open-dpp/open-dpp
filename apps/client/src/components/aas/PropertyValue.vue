<script setup lang="ts">
import type { DataTypeDefType } from "@open-dpp/dto";
import { DataTypeDef } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";

const props = defineProps<{
  id: string;
  modelValue: string | undefined | null;
  invalid?: boolean;
  valueType?: DataTypeDefType;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | undefined | null): void;
}>();

const { locale } = useI18n();

const INTEGER_TYPES = new Set<DataTypeDefType>([
  DataTypeDef.Int,
  DataTypeDef.Long,
  DataTypeDef.Integer,
  DataTypeDef.Short,
  DataTypeDef.Byte,
  DataTypeDef.NonPositiveInteger,
  DataTypeDef.PositiveInteger,
  DataTypeDef.NegativeInteger,
  DataTypeDef.NonNegativeInteger,
  DataTypeDef.UnsignedShort,
  DataTypeDef.UnsignedInt,
  DataTypeDef.UnsignedLong,
  DataTypeDef.UnsignedByte,
]);

const NUMERIC_TYPES = new Set<DataTypeDefType>([
  ...INTEGER_TYPES,
  DataTypeDef.Double,
  DataTypeDef.Float,
  DataTypeDef.Decimal,
]);

const DATE_TYPES = new Set<DataTypeDefType>([
  DataTypeDef.Date,
  DataTypeDef.DateTime,
]);

const isNumeric = computed(() =>
  props.valueType ? NUMERIC_TYPES.has(props.valueType) : false,
);

const isDate = computed(() =>
  props.valueType ? DATE_TYPES.has(props.valueType) : false,
);

const maxFractionDigits = computed(() =>
  props.valueType && INTEGER_TYPES.has(props.valueType) ? 0 : 5,
);

const numericValue = computed({
  get: () => {
    try {
      return z.coerce.number().nullish().parse(props.modelValue);
    }
    catch {
      return null;
    }
  },
  set: v => emit("update:modelValue", z.coerce.string().nullish().parse(v)),
});

const dateValue = computed({
  get: () => {
    if (!props.modelValue)
      return null;
    const parsed = new Date(props.modelValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  },
  set: (v: Date | null | undefined) => {
    if (!v) {
      emit("update:modelValue", null);
      return;
    }
    const year = v.getFullYear();
    const month = String(v.getMonth() + 1).padStart(2, "0");
    const day = String(v.getDate()).padStart(2, "0");
    emit("update:modelValue", `${year}-${month}-${day}`);
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
    show-buttons
  />
  <DatePicker
    v-else-if="isDate"
    :id="props.id"
    v-model="dateValue"
    :disabled="props.disabled"
    :invalid="props.invalid"
    date-format="yy-mm-dd"
    show-icon
    fluid
  />
  <InputText
    v-else
    :id="props.id"
    v-model="textValue"
    :disabled="props.disabled"
    :invalid="props.invalid"
  />
</template>

<style scoped></style>
