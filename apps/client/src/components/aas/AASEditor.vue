<script lang="ts" setup>
import type { TreeNode } from "primevue/treenode";
import type { AasEditModeType } from "../../lib/aas-editor.ts";
import { Button, Column, Drawer, TreeTable } from "primevue";
import { onMounted, ref, toRaw } from "vue";
import { useI18n } from "vue-i18n";
import { useAasDrawer } from "../../composables/aas-drawer.ts";
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
const selectedKey = ref();
const { openDrawer, drawerHeader, drawerVisible, editorVNode } = useAasDrawer();

onMounted(async () => {
  await nextPage();
});

function onHideDrawer() {
  selectedKey.value = null;
}

// const emits = defineEmits<{
//   (e: "create"): Promise<void>;
//   (e: "nextPage"): Promise<void>;
//   (e: "previousPage"): Promise<void>;
// }>();

const { t } = useI18n();

function onNodeSelect(node: TreeNode) {
  openDrawer(node.data.modelType, toRaw(node.data.plain), node.data.idShort);
}
</script>

<template>
  <div v-if="submodels">
    <TreeTable
      v-model:selection-keys="selectedKey"
      selection-mode="single"
      :value="submodels"
      table-style="min-width: 50rem"
      :meta-key-selection="false"
      @node-select="onNodeSelect"
    >
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xl font-bold">Editor</span>
          <Button label="Abschnitt hinzufügen" @click="createSubmodel" />
        </div>
      </template>
      <Column field="idShort" header="Name" expander style="width: 34%" />
      <Column field="modelType" header="Type" style="width: 33%" />
    </TreeTable>
    <!--    <Button icon="pi pi-arrow-left" @click="openDrawer('submodel', { id: '1', idShort: 'help' })" /> -->
    <Drawer
      v-model:visible="drawerVisible"
      :header="drawerHeader"
      position="right"
      class="!w-full md:!w-80 lg:!w-3/4"
      @hide="onHideDrawer"
    >
      <component
        :is="editorVNode.component"
        v-if="editorVNode"
        v-bind="editorVNode.props"
      />
    </Drawer>
  </div>
</template>
