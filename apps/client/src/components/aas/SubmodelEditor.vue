<script setup lang="ts">
import type { AasEditorPath, SubmodelEditorProps } from "../../composables/aas-drawer.ts";

const props = defineProps<{
  path: AasEditorPath;
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
