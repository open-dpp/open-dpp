<script setup lang="ts">
import { v4 as uuid4 } from "uuid";
import PropertyValueField from "./PropertyValueField.vue";
import { onMounted } from "vue";

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

onMounted(() => {
  if (!model.value) {
    generateIdShort();
  }
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <h3 class="text-xl font-bold">{{ props.label }}</h3>
    <InputGroup>
      <InputText
        :id="props.id"
        v-model="model"
        :disabled="props.disabled"
        :aria-describedby="label"
        :aria-invalid="showError ? 'true' : undefined"
      />
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
    </InputGroup>
    <Message v-if="showError" :id="error" size="small" severity="error" variant="simple">
      {{ props.error }}
    </Message>
  </div>
</template>
