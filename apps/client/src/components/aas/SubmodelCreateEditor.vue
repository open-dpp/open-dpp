<script setup lang="ts">
import type { SubmodelEditorProps } from "../../composables/aas-drawer.ts";

const props = defineProps<{
  data: SubmodelEditorProps;
}>();
</script>

<template>
  <div>
    Submodel
    {{ props.data.id }}
    {{ props.data.idShort }}
  </div>
</template>
