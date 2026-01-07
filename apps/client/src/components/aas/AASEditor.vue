<script lang="ts" setup>
import type { AasEditModeType } from "../../lib/aas-editor.ts";
import { Button } from "primevue";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAasEditor } from "../../composables/aas-editor.ts";
import { AasEditMode } from "../../lib/aas-editor.ts";
import apiClient from "../../lib/api-client.ts";

const props = defineProps<{
  id: string;
  editorMode: AasEditModeType;
}>();

const { submodels, nextPage, createSubmodel } = useAasEditor({
  id: props.id,
  aasNamespace:
    props.editorMode === AasEditMode.Passport
      ? apiClient.dpp.templates.aas // TODO: Replace templates here by passports
      : apiClient.dpp.templates.aas,
});

onMounted(async () => {
  await nextPage();
});

// const emits = defineEmits<{
//   (e: "create"): Promise<void>;
//   (e: "nextPage"): Promise<void>;
//   (e: "previousPage"): Promise<void>;
// }>();

const { t } = useI18n();
</script>

<template>
  <div v-if="submodels">
    <Button label="Submodel" @click="createSubmodel" />
    <div v-for="submodel of submodels.result" :key="submodel.id">
      {{ submodel.id }}}
    </div>
  </div>
</template>
