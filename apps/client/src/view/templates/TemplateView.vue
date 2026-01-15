<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AASEditor from "../../components/aas/AASEditor.vue";
import { AasEditMode } from "../../lib/aas-editor.ts";

const route = useRoute();

const id = computed(() => route.params.templateId ? String(route.params.templateId) : undefined);
</script>

<template>
  <AASEditor v-if="id" :id="id" class="h-[calc(100vh-64px)]" :editor-mode="AasEditMode.Template" />
</template>
