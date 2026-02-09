<script setup lang="ts">
import type { FieldView } from "../../lib/field-view";
import MediaFieldView from "../media/MediaFieldView.vue";

const props = defineProps<{ fieldView: FieldView }>();
</script>

<template>
  <MediaFieldView v-if="typeof props.fieldView.value === 'string'" :media-id="props.fieldView.value" />
</template>
