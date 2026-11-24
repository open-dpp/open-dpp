<script lang="ts" setup>
import {
  type DigitalProductDocumentDto,
  DigitalProductDocumentStatusDto,
  EditingModeDto,
} from "@open-dpp/dto";
import { useConfirm } from "primevue/useconfirm";
import { computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAasEditor } from "../../composables/aas-editor.ts";
import { useEditingCapabilities, useEditingMode } from "../../composables/editing-capabilities.ts";
import apiClient from "../../lib/api-client.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import { usePresentationConfigurationStore } from "../../stores/presentation-configuration.ts";
import { convertLocaleToLanguage } from "../../translations/util.ts";
import ProductImageGalleria from "../media/ProductImageGalleria.vue";
import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../../lib/digital-product-document.ts";
import AasEditorDrawer, { type AasEditorContext } from "./AasEditorDrawer.vue";
import AasSubmodelTree from "./AasSubmodelTree.vue";

const model = defineModel<DigitalProductDocumentDto>({ required: true });

const props = defineProps<{
  type: DigitalProductDocumentTypeType;
}>();
const route = useRoute();
const router = useRouter();

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
const presentationConfigurationNamespace =
  props.type === DigitalProductDocumentType.Passport
    ? apiClient.dpp.passports.presentationConfiguration
    : apiClient.dpp.templates.presentationConfiguration;

const confirm = useConfirm();

const status = computed(() => model.value.lastStatusChange?.currentStatus);

const editingMode = useEditingMode(props.type, model);
const { canEditStructure, isReadOnly, isEditingRestrictedToData } = useEditingCapabilities(
  editingMode,
  status,
);

const editingModeMessage = computed(() => {
  switch (editingMode.value) {
    case EditingModeDto.ReadOnly:
      return t("editingMode.readOnlyTooltip");
    case EditingModeDto.DataOnly:
      return t("editingMode.dataOnlyTooltip");
    default:
      return undefined;
  }
});

const presentationConfigStore = usePresentationConfigurationStore();

function fetchPresentationConfig() {
  return presentationConfigStore.fetch({
    referenceId: model.value.id,
    namespace: presentationConfigurationNamespace,
    errorHandlingStore,
    translate: t,
  });
}

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
  isReadOnly,
  isEditingRestrictedToData,
  onAfterMove: fetchPresentationConfig,
});

const {
  selectedKeys,
  submodels,
  selectTreeNode,
  buildAddSubmodelElementMenu,
  buildMoveMenu,
  moveMenuItems,
  moveToDialogVisible,
  moveToDialogSubmodels,
  moveToDialogClassify,
  moveToDialogSelected,
  confirmMoveTo,
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
  () => route.query.config,
  (next) => {
    presentationConfigStore.setActiveConfigId(typeof next === "string" ? next : null);
  },
  { immediate: true },
);

watch(
  () => presentationConfigStore.activeConfigId,
  (next) => {
    const current = typeof route.query.config === "string" ? route.query.config : null;
    if (current === next) return;
    router.push({ query: { ...route.query, config: next ?? undefined } });
  },
);

watch(
  () => status.value,
  async () => {
    await reloadCurrentPage();
  },
);

onMounted(async () => {
  await init();
  await fetchPresentationConfig();
});

onUnmounted(() => {
  presentationConfigStore.$reset();
});

async function onHideDrawer() {
  hideDrawer();
  await router.push({
    query: {
      ...route.query,
      edit: undefined,
    },
  });
  await reloadCurrentPage();
}

const editorContext = computed<AasEditorContext>(() => ({
  id: model.value.id,
  aasNamespace,
  errorHandlingStore,
  isReadOnly: isReadOnly.value,
  isEditingRestrictedToData: isEditingRestrictedToData.value,
  type: props.type,
  openDrawer: aasEditor.openDrawer,
  getAccessPermissionRules,
  modifyShell,
  deletePolicyBySubjectAndObject,
}));
</script>

<template>
  <div class="flex flex-col gap-2">
    <Message v-if="editingModeMessage" severity="info" icon="pi pi-lock" :closable="false">{{
      editingModeMessage
    }}</Message>
    <Card>
      <template #content>
        <div class="flex items-start justify-between gap-2">
          <div class="flex gap-2">
            <div style="width: 340px" data-testid="product-image-galleria">
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
            v-if="canEditStructure"
            icon="pi pi-pencil"
            severity="primary"
            :aria-label="t('common.edit')"
            :label="t('common.edit')"
            @click="openAssetAdministrationShellEditor"
          />
        </div>
      </template>
    </Card>
    <AasSubmodelTree
      v-if="submodels"
      v-model:selected-keys="selectedKeys"
      v-model:move-to-dialog-visible="moveToDialogVisible"
      v-model:move-to-dialog-selected="moveToDialogSelected"
      :submodels="submodels"
      :loading="loading"
      :is-read-only="isReadOnly"
      :is-editing-restricted-to-data="isEditingRestrictedToData"
      :select-tree-node="selectTreeNode"
      :create-submodel="createSubmodel"
      :delete-submodel="deleteSubmodel"
      :delete-submodel-element="deleteSubmodelElement"
      :build-add-submodel-element-menu="buildAddSubmodelElementMenu"
      :submodel-elements-to-add="submodelElementsToAdd"
      :build-move-menu="buildMoveMenu"
      :move-menu-items="moveMenuItems"
      :move-to-dialog-submodels="moveToDialogSubmodels"
      :move-to-dialog-classify="moveToDialogClassify"
      :confirm-move-to="confirmMoveTo"
      :current-page="currentPage"
      :has-previous="hasPrevious"
      :has-next="hasNext"
      :reset-cursor="resetCursor"
      :previous-page="previousPage"
      :next-page="nextPage"
    />
    <AasEditorDrawer
      v-model:visible="drawerVisible"
      :editor-v-node="editorVNode"
      :drawer-header="drawerHeader"
      :save-button-is-visible="saveButtonIsVisible"
      :hide-drawer="onHideDrawer"
      :editor-context="editorContext"
    />
  </div>
</template>
