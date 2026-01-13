<script setup lang="ts">
import type {
  AasEditorPath,
  SubmodelElementCollectionEditorProps,
} from "../../composables/aas-drawer.ts";

const props = defineProps<{
  path: AasEditorPath;
  data: SubmodelElementCollectionEditorProps;
}>();
</script>

<template>
  <div>
    SubmodelElementCollection
    {{ props.data.idShort }}
  </div>
</template>
