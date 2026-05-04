<script lang="ts" setup>
import type { TreeNode } from "primevue/treenode";
import {
  type DigitalProductDocumentDto,
  DigitalProductDocumentStatusDto,
  type DigitalProductDocumentStatusDtoType,
  KeyTypes,
} from "@open-dpp/dto";
import { useConfirm } from "primevue/useconfirm";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAasEditor } from "../../composables/aas-editor.ts";
import apiClient from "../../lib/api-client.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import ProductImageGalleria from "../media/ProductImageGalleria.vue";
import TablePagination from "../pagination/TablePagination.vue";
import SubmodelElementListCreateEditor from "./SubmodelElementListCreateEditor.vue";
import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../../lib/digital-product-document.ts";

const model = defineModel<DigitalProductDocumentDto>({ required: true });

const props = defineProps<{
  type: DigitalProductDocumentTypeType;
}>();
const route = useRoute();
const router = useRouter();
const componentRef = ref<{
  submit: () => Promise<void>;
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
const aasNamespace =
  props.type === DigitalProductDocumentType.Passport
    ? apiClient.dpp.passports.aas
    : apiClient.dpp.templates.aas;

const confirm = useConfirm();

const status = computed(() => model.value.lastStatusChange.currentStatus);

const isArchived = computed(() => status.value === DigitalProductDocumentStatusDto.Archived);

const aasEditor = useAasEditor({
  id: model.value.id,
  aasNamespace,
  initialSelectedKeys: route.query.edit ? String(route.query.edit) : undefined,
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  changeQueryParams,
  selectedLanguage: convertLocaleToLanguage(locale.value),
  errorHandlingStore,
  translate: t,
  openConfirm: confirm.require,
  status: status,
});

const {
  selectedKeys,
  submodels,
  selectTreeNode,
  buildAddSubmodelElementMenu,
  init,
  createSubmodel,
  openAssetAdministrationShellEditor,
  deleteSubmodel,
  deleteSubmodelElement,
  submodelElementsToAdd,
  loading,
  drawerVisible,
  drawerHeader,
  hideDrawer,
  saveButtonIsVisible,
  editorVNode,
  currentPage,
  hasPrevious,
  hasNext,
  previousPage,
  resetCursor,
  nextPage,
  reloadCurrentPage,
  displayName,
  aasGalleryFiles,
  getAccessPermissionRules,
  modifyShell,
  deletePolicyBySubjectAndObject,
} = aasEditor;

watch(
  () => status.value,
  async () => {
    await reloadCurrentPage();
  },
);

onMounted(async () => {
  await init();
});

const popover = ref();

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

async function deleteClicked(node: TreeNode) {
  if (node.data.modelType === KeyTypes.Submodel) {
    await deleteSubmodel(node.key);
  } else {
    await deleteSubmodelElement(node.data.path);
  }
}
function onSubmit() {
  if (componentRef.value) {
    componentRef.value.submit();
  }
}

const isFullPosition = computed(() => position.value === fullPosition);
</script>

<template>
  <div class="flex flex-col gap-2">
    <Card>
      <template #content>
        <div class="flex items-start justify-between gap-2">
          <div class="flex gap-2">
            <div style="width: 340px">
              <ProductImageGalleria v-model="aasGalleryFiles" />
            </div>
            <div class="flex flex-col gap-2">
              <div>
                <dl class="divide-y divide-gray-100">
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-900">
                      {{ t("aasEditor.formLabels.id") }}
                    </dt>
                    <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {{ model.id }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-900">
                      {{ t("aasEditor.formLabels.name") }}
                    </dt>
                    <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {{ displayName === "" ? t("common.untitled") : displayName }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
          <Button
            v-if="!isArchived"
            icon="pi pi-pencil"
            severity="primary"
            :aria-label="t('common.edit')"
            :label="t('common.edit')"
            @click="openAssetAdministrationShellEditor"
          />
        </div>
      </template>
    </Card>
    <Card v-if="submodels">
      <template #content>
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
        >
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xl font-bold">{{ t("aasEditor.submodel", 2) }}</span>
              <Button
                v-if="!isArchived"
                :label="t('aasEditor.addSubmodel')"
                @click="createSubmodel"
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
                    @click="selectTreeNode(node.key)"
                  />
                  <Button
                    v-else
                    v-tooltip.top="node.data.actions.read.tooltip"
                    :aria-label="node.data.actions.read.tooltip"
                    :disabled="!node.data.actions.read.enabled"
                    icon="pi pi-eye"
                    severity="primary"
                    @click="selectTreeNode(node.key)"
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
      </template>
    </Card>
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
        <div class="flex w-full flex-row items-center justify-between gap-1 pr-2">
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
              v-if="saveButtonIsVisible"
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
        :id="model.id"
        ref="componentRef"
        :aas-namespace="aasNamespace"
        :open-drawer="aasEditor.openDrawer"
        :error-handling-store="errorHandlingStore"
        :translate="t"
        :get-access-permission-rules="getAccessPermissionRules"
        :modify-shell="modifyShell"
        :delete-policy-by-subject-and-object="deletePolicyBySubjectAndObject"
        :is-archived="isArchived"
      />
    </Drawer>
  </div>
</template>

<style>
.aas-editor-drawer-mask {
  z-index: 51;
}
</style>
