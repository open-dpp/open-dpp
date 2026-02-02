<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AASEditor from "../../components/aas/AASEditor.vue";
import { AasEditMode } from "../../lib/aas-editor.ts";

const route = useRoute();

const id = computed(() => route.params.passportId ? String(route.params.passportId) : undefined);
</script>

<template>
  <AASEditor v-if="id" :id="id" class="h-[calc(100vh-64px)]" :editor-mode="AasEditMode.Passport" />
</template>
