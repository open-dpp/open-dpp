<script setup lang="ts">
import LanguageTextArrayForm from "./LanguageTextArrayForm.vue";

const props = defineProps<{
  submitAttempted: boolean;
  disabled?: boolean;
}>();
</script>

<template>
  <LanguageTextArrayForm
    field-name="displayName"
    heading="aasEditor.formLabels.name"
    row-label="aasEditor.formLabels.name"
    data-cy-prefix="display-name"
    :submit-attempted="props.submitAttempted"
    :disabled="props.disabled"
  />
</template>
