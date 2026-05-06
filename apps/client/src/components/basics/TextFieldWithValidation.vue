<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    id: string;
    label?: string;
    disabled?: boolean;
    showErrors: boolean;
    error: string | undefined;
    modelValue: string | null;
    treatEmptyStringAsNull?: boolean;
    errorPlacement?: "flow" | "absolute";
  }>(),
  {
    errorPlacement: "flow",
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: string | null];
  blur: [event: FocusEvent];
}>();

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val === "" && props.treatEmptyStringAsNull ? null : val),
});

const isErrorVisible = computed(() => props.showErrors && !!props.error);
const isAbsolute = computed(() => props.errorPlacement === "absolute");
const errorMessageId = computed(() => `${props.id}-error`);
const describedBy = computed(() => (isErrorVisible.value ? errorMessageId.value : undefined));

// When errorPlacement="absolute" we want the Message to overflow the row on
// desktop (lg+) so the grid row height stays stable. On mobile the grid
// collapses to a single column and rows stack naturally — flow is safer there
// because absolute positioning would overlap the next stacked item.
const containerClasses = computed(() =>
  isAbsolute.value ? "flex flex-col gap-2 lg:relative lg:gap-0" : "flex flex-col gap-2",
);
const messageClasses = computed(() =>
  isAbsolute.value
    ? "lg:pointer-events-none lg:absolute lg:top-full lg:left-0 lg:mt-1 lg:w-full"
    : "",
);
</script>

<template>
  <div :class="containerClasses">
    <InputGroup>
      <InputGroupAddon v-if="$slots.addonLeft">
        <slot name="addonLeft" />
      </InputGroupAddon>
      <FloatLabel v-if="props.label" variant="on">
        <InputText
          :id="props.id"
          v-model="internalValue"
          :invalid="isErrorVisible"
          :disabled="props.disabled"
          :aria-describedby="describedBy"
          :aria-invalid="isErrorVisible ? 'true' : undefined"
          @blur="emit('blur', $event)"
        />
        <label :for="props.id">{{ props.label }}</label>
      </FloatLabel>
      <InputText
        v-else-if="props.label === undefined"
        :id="props.id"
        v-model="internalValue"
        :invalid="isErrorVisible"
        :disabled="props.disabled"
        :aria-describedby="describedBy"
        :aria-invalid="isErrorVisible ? 'true' : undefined"
        @blur="emit('blur', $event)"
      />
    </InputGroup>
    <Message
      v-if="isErrorVisible"
      :id="errorMessageId"
      size="small"
      severity="error"
      variant="simple"
      :class="messageClasses"
    >
      {{ props.error }}
    </Message>
  </div>
</template>
