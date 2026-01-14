<script setup lang="ts">
import type { PropertyEditorProps } from "../../composables/aas-drawer.ts";

const props = defineProps<{
  data: PropertyEditorProps;
}>();
</script>

<template>
  <div>
    Property
    {{ props.data.valueType }}
  </div>
</template>
