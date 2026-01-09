<script setup lang="ts">
import { Button, InputGroupAddon, InputText } from "primevue";
import { v4 as uuid4 } from "uuid";
import FormField from "./FormField.vue";

const props = defineProps<{
  id: string;
  label: string;
  showError: boolean;
  error: string | undefined | null;
}>();

const model = defineModel();

function generateIdShort() {
  model.value = uuid4();
}
</script>

<template>
  <FormField
    v-model="model"
    v-bind="props"
    label="Id"
    :component="InputText"
  >
    <template #addon-right>
      <InputGroupAddon>
        <Button
          v-tooltip.top="'Generate Id'"
          icon="pi pi-sparkles"
          severity="secondary"
          variant="text"
          @click="generateIdShort"
        />
      </InputGroupAddon>
    </template>
  </FormField>
</template>
