<script lang="ts" setup>
import InputNumber from "primevue/inputnumber";
import { computed } from "vue";

const props = defineProps<{
  id: string;
  className?: string;
  label?: string;
  modelValue?: number | null;
  options?: Record<string, unknown>;
  required?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: number | null): void;
}>();

const min = computed(() => props.options?.min as number | undefined);
const max = computed(() => props.options?.max as number | undefined);
</script>

<template>
  <div class="flex flex-col gap-2" :class="props.className">
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-gray-900 dark:text-white"
    >{{ label }}</label>
    <InputNumber
      :id="id"
      :model-value="modelValue"
      :min="min"
      :max="max"
      :data-cy="props.id"
      class="w-full"
      :required="required"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>
