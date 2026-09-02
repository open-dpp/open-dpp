<script setup lang="ts">
import LanguageTextArrayForm from "./LanguageTextArrayForm.vue";

const props = defineProps<{
  submitAttempted: boolean;
  disabled?: boolean;
}>();
</script>

<template>
  <LanguageTextArrayForm
    field-name="description"
    heading="aasEditor.formLabels.description"
    row-label="aasEditor.formLabels.description"
    data-cy-prefix="description"
    :submit-attempted="props.submitAttempted"
    :disabled="props.disabled"
  />
</template>
