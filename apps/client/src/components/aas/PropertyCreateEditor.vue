<script setup lang="ts">
import type { PropertyCreateEditorProps } from "../../composables/aas-drawer.ts";

const props = defineProps<{
  data: PropertyCreateEditorProps;
}>();
</script>

<template>
  <div>
    Create Property
    {{ props.data.valueType }}
  </div>
</template>
