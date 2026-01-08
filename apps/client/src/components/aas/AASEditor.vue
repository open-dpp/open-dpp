<script lang="ts" setup>
import type { TreeNode } from "primevue/treenode";
import type { AasEditModeType } from "../../lib/aas-editor.ts";
import { Button, Column, Drawer, Menu, TreeTable } from "primevue";
import { onMounted, ref, toRaw } from "vue";
import { useI18n } from "vue-i18n";
import { EditorMode, useAasDrawer } from "../../composables/aas-drawer.ts";
import { useAasEditor } from "../../composables/aas-editor.ts";
import { AasEditMode } from "../../lib/aas-editor.ts";
import apiClient from "../../lib/api-client.ts";

const props = defineProps<{
  id: string;
  editorMode: AasEditModeType;
}>();

const { openDrawer, drawerHeader, drawerVisible, editorVNode } = useAasDrawer();

const { submodels, nextPage, createSubmodel, submodelElementsToAdd } = useAasEditor({
  id: props.id,
  aasNamespace:
    props.editorMode === AasEditMode.Passport
      ? apiClient.dpp.templates.aas // TODO: Replace templates here by passports
      : apiClient.dpp.templates.aas,
  openDrawer,
});
const selectedKey = ref();

onMounted(async () => {
  await nextPage();
});

function onHideDrawer() {
  selectedKey.value = null;
}
const popover = ref();

// const emits = defineEmits<{
//   (e: "create"): Promise<void>;
//   (e: "nextPage"): Promise<void>;
//   (e: "previousPage"): Promise<void>;
// }>();

const { t } = useI18n();

function onNodeSelect(node: TreeNode) {
  openDrawer({ type: node.data.modelType, data: toRaw(node.data.plain), title: node.data.idShort, mode: EditorMode.EDIT });
}
function addClicked(event: any, key: string) {
  console.log(key);
  popover.value.toggle(event);
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
      <Column>
        <template #body="{ node }">
          <div class="flex w-full justify-end">
            <div class="flex items-center rounded-md gap-2">
              <Button icon="pi pi-plus" severity="primary" @click="addClicked($event, node.key)" />
            </div>
          </div>
        </template>
      </Column>
    </TreeTable>
    <Menu id="overlay_menu" ref="popover" :model="submodelElementsToAdd" :popup="true" position="right" />
    <!--    <Popover ref="popover" position="right" append-to="body"> -->
    <!--      Content here -->
    <!--    </Popover> -->
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
