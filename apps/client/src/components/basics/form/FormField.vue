<script setup lang="ts">
import type { InputNumber, InputText } from "primevue";
import { FloatLabel, InputGroup, Message } from "primevue";

const props = defineProps<{
  id: string;
  label: string;
  showError: boolean;
  error: string | undefined | null;
  component: InputText | InputNumber;
}>();
const model = defineModel();
</script>

<template>
  <div class="flex flex-col gap-2 field">
    <InputGroup>
      <FloatLabel variant="on">
        <component :is="props.component" :id="props.id" v-model="model" :invalid="props.showError && !!props.error" />
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
