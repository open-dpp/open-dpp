<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useField } from "vee-validate";
import { watch } from "vue";
import { z } from "zod";
import TextFieldWithValidation from "../basics/TextFieldWithValidation.vue";

const props = defineProps<{
  id: string;
  modelValue: string | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
}>();

const url = z.preprocess(
  v => (typeof v === "string" && v.trim() === "" ? null : v),
  z.url().nullish(),
);

const { value, errorMessage } = useField<string | null>(
  `link-${props.id}`,
  toTypedSchema(url),
  { initialValue: props.modelValue, controlled: false },
);

watch(value, (v) => {
  const normalized = url.safeParse(v);
  if (normalized.success) {
    emit("update:modelValue", normalized.data ?? null);
  }
});
</script>

<template>
  <div>
    <TextFieldWithValidation
      :id="props.id"
      v-model="value"
      :show-errors="true"
      :error="errorMessage"
    />
  </div>
</template>
