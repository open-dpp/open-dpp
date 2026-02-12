<script lang="ts" setup>
import type { TreeNode } from "primevue/treenode";
import type { AasEditModeType } from "../../lib/aas-editor.ts";
import { Button, Column, Drawer, Menu, TreeTable } from "primevue";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAasEditor } from "../../composables/aas-editor.ts";
import { AasEditMode } from "../../lib/aas-editor.ts";
import apiClient from "../../lib/api-client.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import TablePagination from "../pagination/TablePagination.vue";
import SubmodelElementListCreateEditor from "./SubmodelElementListCreateEditor.vue";

const props = defineProps<{
  id: string;
  editorMode: AasEditModeType;
}>();
const route = useRoute();
const router = useRouter();
const componentRef = ref<{
  submit: () => Promise<Promise<void> | undefined>;
} | null>(null);

const defaultPosition = "right";
const fullPosition = "full";
const position = ref(defaultPosition);
const { locale, t } = useI18n();

function changeQueryParams(newQuery: Record<string, string | undefined>) {
  router.push({
    query: {
      ...route.query,
      ...newQuery,
    },
  });
}

const errorHandlingStore = useErrorHandlingStore();
const aasNamespace
  = props.editorMode === AasEditMode.Passport
    ? apiClient.dpp.passports.aas
    : apiClient.dpp.templates.aas;

const aasEditor = useAasEditor({
  id: props.id,
  aasNamespace,
  initialSelectedKeys: route.query.edit ? String(route.query.edit) : undefined,
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  changeQueryParams,
  selectedLanguage: convertLocaleToLanguage(locale.value),
  errorHandlingStore,
  translate: t,
});

const {
  selectedKeys,
  submodels,
  selectTreeNode,
  buildAddSubmodelElementMenu,
  init,
  createSubmodel,
  submodelElementsToAdd,
  loading,
  drawerVisible,
  drawerHeader,
  hideDrawer,
  editorVNode,
  currentPage,
  hasPrevious,
  hasNext,
  previousPage,
  resetCursor,
  nextPage,
} = aasEditor;

onMounted(async () => {
  await init();
});

const popover = ref();

function onNodeSelect(node: TreeNode) {
  selectTreeNode(node.key);
}

function onHideDrawer() {
  hideDrawer();
  router.push({
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
  if (componentRef.value) {
    componentRef.value.submit();
  }
}

const isFullPosition = computed(() => position.value === fullPosition);
</script>

<template>
  <div v-if="submodels">
    <TreeTable
      v-model:selection-keys="selectedKeys"
      selection-mode="single"
      :value="submodels"
      table-style="min-width: 50rem"
      :meta-key-selection="false"
      paginator
      :loading="loading"
      :rows="10"
      :rows-per-page-options="[10]"
      @node-select="onNodeSelect"
    >
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xl font-bold">Editor</span>
          <Button :label="t('aasEditor.addSubmodel')" @click="createSubmodel" />
        </div>
      </template>
      <Column field="label" header="Name" expander style="width: 34%" />
      <Column field="type" :header="t('aasEditor.type')" style="width: 33%" />
      <Column>
        <template #body="{ node }">
          <div class="flex w-full justify-end">
            <div class="flex items-center rounded-md gap-2">
              <Button
                v-if="node.data.actions.addChildren"
                icon="pi pi-plus"
                severity="primary"
                @click="addClicked($event, node)"
              />
            </div>
          </div>
        </template>
      </Column>
      <template #paginatorcontainer>
        <TablePagination
          :current-page="currentPage"
          :has-previous="hasPrevious"
          :has-next="hasNext"
          @reset-cursor="resetCursor"
          @previous-page="previousPage"
          @next-page="nextPage"
        />
      </template>
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
      :position="position"
      :class="{
        'w-full! md:w-80! lg:w-1/2!': !isFullPosition,
        'w-full!': isFullPosition,
      }"
      :pt="{
        mask: { class: 'aas-editor-drawer-mask' },
      }"
      :auto-z-index="false"
      @hide="onHideDrawer"
    >
      <template #header>
        <div
          class="flex flex-row items-center justify-between w-full pr-2 gap-1"
        >
          <span class="text-xl font-bold">{{ drawerHeader }}</span>
          <div class="flex gap-3">
            <Button
              v-if="position === defaultPosition"
              severity="secondary"
              variant="text"
              icon="pi pi-window-maximize"
              @click="position = fullPosition"
            />
            <Button
              v-else
              severity="secondary"
              variant="text"
              icon="pi pi-window-minimize"
              @click="position = defaultPosition"
            />
            <Button
              :label="
                editorVNode?.component === SubmodelElementListCreateEditor
                  ? t('aasEditor.table.saveAndAddEntries')
                  : t('common.save')
              "
              @click="onSubmit"
            />
          </div>
        </div>
      </template>
      <component
        :is="editorVNode.component"
        v-if="editorVNode"
        v-bind="editorVNode.props"
        :id="props.id"
        ref="componentRef"
        :aas-namespace="aasNamespace"
        :open-drawer="aasEditor.openDrawer"
        :error-handling-store="errorHandlingStore"
        :translate="t"
      />
    </Drawer>
  </div>
</template>

<style>
.aas-editor-drawer-mask {
  z-index: 51;
}
</style>
