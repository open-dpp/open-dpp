<script setup lang="ts">
import { FloatLabel, InputGroup, Message } from "primevue";
import { computed } from "vue";
import { z } from "zod/v4";

const props = defineProps<{
  id: string;
  label: string;
  showError: boolean;
  error: string | undefined | null;
  modelValue: string | number | undefined | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
}>();

const isNumeric = computed(() => {
  return z.number().safeParse(props.modelValue).success;
});

const numericValue = computed<number>({
  get: () => Number(props.modelValue),
  set: v => emit("update:modelValue", v),
});

const textValue = computed<string>({
  get: () => String(props.modelValue),
  set: v => emit("update:modelValue", v),
});
</script>

<template>
  <div class="flex flex-col gap-2 field">
    <InputGroup>
      <FloatLabel variant="on">
        <InputNumber
          v-if="isNumeric"
          :id="props.id"
          v-model="numericValue"
          :invalid="props.showError && !!props.error"
        />
        <InputText
          v-else
          :id="props.id"
          v-model="textValue"
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
