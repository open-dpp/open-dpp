<script setup lang="ts">
import {
  FloatLabel,
  InputGroup,
  InputGroupAddon,
  InputText,
  Message,
} from "primevue";

const props = defineProps<{
  id: string;
  label?: string;
  showErrors: boolean;
  error: string | undefined;
}>();
const model = defineModel<string | null | undefined>();
</script>

<template>
  <InputGroup>
    <InputGroupAddon v-if="$slots.addonLeft">
      <slot name="addonLeft" />
    </InputGroupAddon>
    <FloatLabel v-if="props.label" variant="on">
      <InputText
        :id="props.id"
        v-model="model"
        :invalid="props.showErrors && !!props.error"
      />
      <label :for="props.id">{{ props.label }}</label>
    </FloatLabel>
    <InputText
      v-else-if="props.label === undefined"
      :id="props.id"
      v-model="model"
      :invalid="props.showErrors && !!props.error"
    />
  </InputGroup>
  <Message
    v-if="props.showErrors && props.error"
    size="small"
    severity="error"
    variant="simple"
  >
    {{ props.error }}
  </Message>
</template>
