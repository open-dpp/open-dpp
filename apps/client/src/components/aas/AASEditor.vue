<script lang="ts" setup>
import type { TreeNode } from "primevue/treenode";
import type { AasEditModeType } from "../../lib/aas-editor.ts";
import { Button, Column, Drawer, Menu, TreeTable } from "primevue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAasEditor } from "../../composables/aas-editor.ts";
import { AasEditMode } from "../../lib/aas-editor.ts";
import apiClient from "../../lib/api-client.ts";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import TablePagination from "../pagination/TablePagination.vue";

const props = defineProps<{
  id: string;
  editorMode: AasEditModeType;
}>();
const route = useRoute();
const router = useRouter();
const componentRef = ref(null);

const { t, locale } = useI18n();

function changeQueryParams(newQuery: Record<string, string>) {
  router.replace({
    query: {
      ...route.query,
      ...newQuery,
    },
  });
}

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
} = useAasEditor({
  id: props.id,
  aasNamespace:
    props.editorMode === AasEditMode.Passport
      ? apiClient.dpp.templates.aas // TODO: Replace templates here by passports
      : apiClient.dpp.templates.aas,
  initialSelectedKeys: route.query.edit ? String(route.query.edit) : undefined,
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  changeQueryParams,
  selectedLanguage: convertLocaleToLanguage(locale.value),
});

onMounted(async () => {
  await init();
});

const popover = ref();

function onNodeSelect(node: TreeNode) {
  selectTreeNode(node.key);
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
      v-model:selection-keys="selectedKeys"
      selection-mode="single"
      :value="submodels"
      table-style="min-width: 50rem"
      :meta-key-selection="false"
      paginator
      :loading="loading"
      :rows="10" :rows-per-page-options="[10]" @node-select="onNodeSelect"
    >
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xl font-bold">Editor</span>
          <Button label="Abschnitt hinzufügen" @click="createSubmodel" />
        </div>
      </template>
      <Column field="label" header="Name" expander style="width: 34%" />
      <Column field="type" header="Type" style="width: 33%" />
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
