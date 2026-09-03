<script setup lang="ts">
import type { SubmodelResponseDto } from "@open-dpp/dto";
import { KeyTypes } from "@open-dpp/dto";
import type { MenuItem } from "primevue/menuitem";
import type { TreeTableSelectionKeys } from "primevue";
import type { TreeNode } from "primevue/treenode";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import type { AasEditorPath } from "../../composables/aas-drawer.ts";
import type { Page } from "../../composables/pagination.ts";
import type {
  ClassifyIdShortPathNode,
  IdShortPathPointer,
} from "../../lib/id-short-path-select.ts";
import TablePagination from "../pagination/TablePagination.vue";
import AasMoveDialog from "./AasMoveDialog.vue";

const selectedKeys = defineModel<TreeTableSelectionKeys | undefined>("selectedKeys", {
  required: true,
});
const moveToDialogVisible = defineModel<boolean>("moveToDialogVisible", { required: true });
const moveToDialogSelected = defineModel<IdShortPathPointer | null>("moveToDialogSelected", {
  required: true,
});

const props = defineProps<{
  submodels: TreeNode[];
  loading: boolean;
  isArchived: boolean;
  selectTreeNode: (key: string) => void;
  createSubmodel: () => Promise<void>;
  deleteSubmodel: (submodelId: string) => Promise<void>;
  deleteSubmodelElement: (path: AasEditorPath) => Promise<void>;
  buildAddSubmodelElementMenu: (node: TreeNode) => void;
  submodelElementsToAdd: MenuItem[];
  buildMoveMenu: (node: TreeNode) => void;
  moveMenuItems: MenuItem[];
  moveToDialogSubmodels: SubmodelResponseDto[];
  moveToDialogClassify: ClassifyIdShortPathNode;
  confirmMoveTo: () => Promise<void>;
  currentPage: Page;
  hasPrevious: boolean;
  hasNext: boolean;
  resetCursor: () => Promise<void>;
  previousPage: () => Promise<Page>;
  nextPage: () => Promise<Page>;
}>();

const { t } = useI18n();

const popover = ref();

function addClicked(event: Event, node: TreeNode) {
  props.buildAddSubmodelElementMenu(node);
  popover.value.toggle(event);
}

const movePopover = ref();

function moveClicked(event: Event, node: TreeNode) {
  props.buildMoveMenu(node);
  movePopover.value.toggle(event);
}

async function deleteClicked(node: TreeNode) {
  if (node.data.modelType === KeyTypes.Submodel) {
    await props.deleteSubmodel(node.key);
  } else {
    await props.deleteSubmodelElement(node.data.path);
  }
}
</script>

<template>
  <Card v-if="props.submodels">
    <template #content>
      <TreeTable
        v-model:selection-keys="selectedKeys"
        selection-mode="single"
        :value="props.submodels"
        table-style="min-width: 50rem"
        :meta-key-selection="false"
        paginator
        :loading="props.loading"
        :rows="10"
        :rows-per-page-options="[10]"
        :pt="{
          row: ({ props: rowProps }: any) => ({ id: `row-${rowProps.node.key}` }),
        }"
      >
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-xl font-bold">{{ t("aasEditor.submodel", 2) }}</h3>
            <Button
              v-if="!props.isArchived"
              :label="t('aasEditor.addSubmodel')"
              @click="props.createSubmodel"
            />
          </div>
        </template>
        <Column field="label" header="Name" expander style="width: 34%" />
        <Column field="type" :header="t('aasEditor.type')" style="width: 33%" />
        <Column>
          <template #body="{ node }">
            <div class="flex w-full justify-end">
              <div class="flex items-center gap-2 rounded-md">
                <Button
                  v-if="node.data.actions.edit.visible"
                  v-tooltip.top="node.data.actions.edit.tooltip"
                  :aria-label="node.data.actions.edit.tooltip"
                  icon="pi pi-pencil"
                  severity="primary"
                  @click="props.selectTreeNode(node.key)"
                />
                <Button
                  v-else
                  v-tooltip.top="node.data.actions.read.tooltip"
                  :aria-label="node.data.actions.read.tooltip"
                  :disabled="!node.data.actions.read.enabled"
                  icon="pi pi-eye"
                  severity="primary"
                  @click="props.selectTreeNode(node.key)"
                />
                <Button
                  v-if="node.data.actions.create.visible"
                  v-tooltip.top="node.data.actions.create.tooltip"
                  :aria-label="t('common.add')"
                  icon="pi pi-plus"
                  severity="secondary"
                  :disabled="!node.data.actions.create.enabled"
                  @click="addClicked($event, node)"
                />
                <Button
                  v-if="node.data.actions.edit.visible"
                  v-tooltip.top="t('common.move')"
                  :aria-label="t('common.move')"
                  icon="pi pi-sort-alt"
                  severity="secondary"
                  :disabled="!node.data.actions.edit.enabled"
                  @click="moveClicked($event, node)"
                />
                <Button
                  v-if="node.data.actions.delete.visible"
                  v-tooltip.top="node.data.actions.delete.tooltip"
                  :aria-label="t('common.remove')"
                  icon="pi pi-trash"
                  severity="danger"
                  :disabled="!node.data.actions.delete.enabled"
                  @click="deleteClicked(node)"
                />
              </div>
            </div>
          </template>
        </Column>
        <template #paginatorcontainer>
          <TablePagination
            :current-page="props.currentPage"
            :has-previous="props.hasPrevious"
            :has-next="props.hasNext"
            @reset-cursor="props.resetCursor"
            @previous-page="props.previousPage"
            @next-page="props.nextPage"
          />
        </template>
      </TreeTable>
      <Menu
        id="overlay_menu"
        ref="popover"
        :model="props.submodelElementsToAdd"
        :popup="true"
        position="right"
      />
      <Menu
        id="move_menu"
        ref="movePopover"
        :model="props.moveMenuItems"
        :popup="true"
        position="right"
      />
      <AasMoveDialog
        v-model:visible="moveToDialogVisible"
        v-model:selected="moveToDialogSelected"
        :submodels="props.moveToDialogSubmodels"
        :classify="props.moveToDialogClassify"
        :confirm="props.confirmMoveTo"
      />
    </template>
  </Card>
</template>
