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
const url = z.url().nullable();
const { value, errorMessage, setValue } = useField<string | null>(
  `link-${props.id}`,
  toTypedSchema(url),
  { initialValue: props.modelValue, controlled: false },
  // without controlled:false this validation does not work when used within SubmodelElementListEditor, since SubmodelElementListEditor itself uses a useForm
);

watch(
  () => props.modelValue,
  (v) => {
    setValue(v ?? null);
  },
);

watch(value, (v) => {
  const parsed = url.safeParse(v);
  if (parsed.success) {
    emit("update:modelValue", parsed.data);
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
      :treat-empty-string-as-null="true"
    />
  </div>
</template>
