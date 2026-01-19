<script setup lang="ts">
import type { DataTypeDefType } from "@open-dpp/dto";
import { DataTypeDef } from "@open-dpp/dto";
import { FloatLabel, InputGroup, InputNumber, InputText, Message } from "primevue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod/v4";

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

const { locale } = useI18n();

const isNumeric = computed(() =>
  props.valueType === DataTypeDef.Double,
);

const numericValue = computed({
  get: () => z.coerce.number().nullish().parse(props.modelValue),
  set: v => emit("update:modelValue", z.coerce.string().nullish().parse(v)),
});

const textValue = computed({
  get: () => z.coerce.string().nullish().parse(props.modelValue),
  set: v => emit("update:modelValue", z.coerce.string().nullish().parse(v)),
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <InputGroup>
      <FloatLabel variant="on">
        <InputNumber
          v-if="isNumeric"
          :id="props.id"
          v-model="numericValue"
          :disabled="props.disabled"
          :invalid="props.showError && !!props.error"
          :locale="locale"
          :max-fraction-digits="5"
        />
        <InputText
          v-else
          :id="props.id"
          v-model="textValue"
          :disabled="props.disabled"
          :invalid="props.showError && !!props.error"
        />
        <label :for="props.id">{{ props.label }}</label>
      </FloatLabel>
      <slot
        name="addon-right"
      />
    </InputGroup>
    <Message v-if="props.showError && props.error" size="small" severity="error" variant="simple">
      {{ props.error }}
    </Message>
  </div>
</template>
