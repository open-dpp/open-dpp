<script lang="ts" setup>
import InputText from "primevue/inputtext";

const props = defineProps<{
  id: string;
  className?: string;
  label?: string;
  modelValue?: string | null;
  required?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <div class="flex flex-col gap-2" :class="props.className">
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-gray-900 dark:text-white"
    >{{ label }}</label>
    <InputText
      :id="id"
      :model-value="modelValue || ''"
      :data-cy="props.id"
      class="w-full"
      :required="required"
      @update:model-value="emit('update:modelValue', $event as string)"
    />
  </div>
</template>
