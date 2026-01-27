<script setup lang="ts">
import { Button, InputGroupAddon } from "primevue";
import { v4 as uuid4 } from "uuid";
import PropertyValueField from "./PropertyValueField.vue";

const props = defineProps<{
  id: string;
  label: string;
  showError: boolean;
  error: string | undefined | null;
  disabled?: boolean;
}>();

const model = defineModel<string | undefined | null>();

function generateIdShort() {
  model.value = uuid4();
}
</script>

<template>
  <PropertyValueField
    v-model="model"
    v-bind="props"
    label="Id"
    :disabled="props.disabled"
  >
    <template #addon-right>
      <InputGroupAddon>
        <Button
          v-tooltip.top="'Generate Id'"
          :disabled="props.disabled"
          icon="pi pi-sparkles"
          severity="secondary"
          variant="text"
          @click="generateIdShort"
        />
      </InputGroupAddon>
    </template>
  </PropertyValueField>
</template>
