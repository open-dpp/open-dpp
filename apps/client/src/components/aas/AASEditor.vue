<script lang="ts" setup>
import type { TreeNode } from "primevue/treenode";
import type { AasEditModeType } from "../../lib/aas-editor.ts";
import { Button, Column, Drawer, Menu, TreeTable } from "primevue";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAasEditor } from "../../composables/aas-editor.ts";
import { AasEditMode } from "../../lib/aas-editor.ts";
import apiClient from "../../lib/api-client.ts";

const props = defineProps<{
  id: string;
  editorMode: AasEditModeType;
}>();
const route = useRoute();
const router = useRouter();
const componentRef = ref(null);

const {
  selectedKey,
  submodels,
  buildAddSubmodelElementMenu,
  nextPage,
  createSubmodel,
  submodelElementsToAdd,
  loading,
  selectTreeNode,
  drawerVisible,
  drawerHeader,
  hideDrawer,
  editorVNode,
} = useAasEditor({
  id: props.id,
  aasNamespace:
    props.editorMode === AasEditMode.Passport
      ? apiClient.dpp.templates.aas // TODO: Replace templates here by passports
      : apiClient.dpp.templates.aas,
});

watch([() => route.query.edit, () => loading.value], ([newVal, newLoading]) => {
  if (newVal && !newLoading) {
    selectTreeNode(String(newVal));
  }
}, { immediate: false });

onMounted(async () => {
  await nextPage();
});

const popover = ref();

const { t } = useI18n();

function onNodeSelect(node: TreeNode) {
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      edit: node.key,
    },
  });
}

function onHideDrawer() {
  hideDrawer();
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      edit: undefined,
    },
  });
}

function addClicked(event: any, node: TreeNode) {
  buildAddSubmodelElementMenu(node);
  popover.value.toggle(event);
}
function onSubmit() {
  componentRef.value.submit();
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
              <Button
                icon="pi pi-plus"
                severity="primary"
                @click="addClicked($event, node)"
              />
            </div>
          </div>
        </template>
      </Column>
    </TreeTable>
    <Menu
      id="overlay_menu"
      ref="popover"
      :model="submodelElementsToAdd"
      :popup="true"
      position="right"
    />
    <Drawer
      v-model:visible="drawerVisible"
      position="right"
      class="!w-full md:!w-80 lg:!w-1/2"
      @hide="onHideDrawer"
    >
      <template #header>
        <div class="flex flex-row items-center justify-between w-full pr-2 gap-1">
          <span class="text-xl font-bold">{{ drawerHeader }}</span>
          <Button label="Save" @click="onSubmit" />
        </div>
      </template>
      <component
        :is="editorVNode.component"
        v-if="editorVNode"
        ref="componentRef"
        v-bind="editorVNode.props"
      />
    </Drawer>
  </div>
</template>
