<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  id: string;
  label?: string;
  disabled?: boolean;
  showErrors: boolean;
  error: string | undefined;
  modelValue: string | null;
  treatEmptyStringAsNull?: boolean;
}>();
const emit = defineEmits(["update:modelValue"]);

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val === "" && props.treatEmptyStringAsNull ? null : val),
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <InputGroup>
      <InputGroupAddon v-if="$slots.addonLeft">
        <slot name="addonLeft" />
      </InputGroupAddon>
      <FloatLabel v-if="props.label" variant="on">
        <InputText
          :id="props.id"
          v-model="internalValue"
          :invalid="props.showErrors && !!props.error"
          :disabled="props.disabled"
        />
        <label :for="props.id">{{ props.label }}</label>
      </FloatLabel>
      <InputText
        v-else-if="props.label === undefined"
        :id="props.id"
        v-model="internalValue"
        :invalid="props.showErrors && !!props.error"
        :disabled="props.disabled"
      />
    </InputGroup>
    <Message v-if="props.showErrors && props.error" size="small" severity="error" variant="simple">
      {{ props.error }}
    </Message>
  </div>
</template>
