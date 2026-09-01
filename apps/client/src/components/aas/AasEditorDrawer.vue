<script setup lang="ts">
import type { AasNamespace } from "@open-dpp/api-client";
import {
  type AccessPermissionRuleResponseDto,
  type AssetAdministrationShellModificationDto,
  type DeletePolicyDto,
  isNumericDataType,
  Permissions,
} from "@open-dpp/dto";
import Tab from "primevue/tab";
import TabList from "primevue/tablist";
import TabPanel from "primevue/tabpanel";
import TabPanels from "primevue/tabpanels";
import Tabs from "primevue/tabs";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useAasAbility } from "../../composables/aas-ability.ts";
import type { EditorVNodeType, IAasDrawer } from "../../composables/aas-drawer.ts";
import type { DigitalProductDocumentTypeType } from "../../lib/digital-product-document.ts";
import type { IErrorHandlingStore } from "../../stores/error.handling.ts";
import EditorActivityHistory from "../activity-history/EditorActivityHistory.vue";
import ElementPresentationPanel from "./presentation/ElementPresentationPanel.vue";
import FileEditor from "./FileEditor.vue";
import PropertyEditor from "./PropertyEditor.vue";
import SubmodelEditor from "./SubmodelEditor.vue";
import SubmodelElementCollectionEditor from "./SubmodelElementCollectionEditor.vue";
import SubmodelElementListCreateEditor from "./SubmodelElementListCreateEditor.vue";
import SubmodelElementListEditor from "./SubmodelElementListEditor.vue";

export interface AasEditorContext {
  id: string;
  aasNamespace: AasNamespace;
  errorHandlingStore: IErrorHandlingStore;
  isArchived: boolean;
  type: DigitalProductDocumentTypeType;
  openDrawer: IAasDrawer["openDrawer"];
  getAccessPermissionRules: () => AccessPermissionRuleResponseDto[];
  modifyShell: (data: AssetAdministrationShellModificationDto) => Promise<void>;
  deletePolicyBySubjectAndObject: (data: DeletePolicyDto) => Promise<void>;
}

const visible = defineModel<boolean>("visible", { required: true });

const props = defineProps<{
  editorVNode: EditorVNodeType;
  drawerHeader: string;
  saveButtonIsVisible: boolean;
  hideDrawer: () => Promise<void>;
  editorContext: AasEditorContext;
}>();

const { t } = useI18n();

const defaultPosition = "right";
const fullPosition = "full";
const position = ref(defaultPosition);
const isFullPosition = computed(() => position.value === fullPosition);

const activeDrawerTab = ref<"data" | "presentation" | "activityHistory">("data");

watch(
  () => visible.value,
  (isVisible) => {
    if (isVisible) {
      activeDrawerTab.value = "data";
    }
  },
);

const isOnDataTab = computed(() => activeDrawerTab.value === "data");

const showPresentationTab = computed(() => {
  if (!props.editorVNode) return false;
  const editorSupportsPresentationConfiguration =
    props.editorVNode.component === PropertyEditor &&
    props.editorVNode.props.data.valueType &&
    isNumericDataType(props.editorVNode.props.data.valueType);
  if (!editorSupportsPresentationConfiguration) return false;
  return Boolean(props.editorVNode?.props?.path?.idShortPathIncludingSubmodel);
});

const showSaveButton = computed(
  () => props.saveButtonIsVisible && (!showPresentationTab.value || isOnDataTab.value),
);

const activityHistoryPath = computed(() => {
  if (
    !props.editorVNode ||
    !props.editorVNode.props.path.idShortPathIncludingSubmodel ||
    !props.editorVNode.component
  ) {
    return undefined;
  }
  const path = props.editorVNode.props.path.idShortPathIncludingSubmodel;

  const hasChildElements = [
    SubmodelElementCollectionEditor,
    SubmodelElementListEditor,
    SubmodelEditor,
  ].includes(props.editorVNode.component as any);

  if (hasChildElements) {
    return `sw:${path}`;
  }
  const isLeafEditor = [PropertyEditor, FileEditor].includes(props.editorVNode.component as any);
  if (isLeafEditor) {
    return path;
  }
  return undefined;
});

const componentRef = ref<{
  submit: () => Promise<void>;
} | null>(null);

async function onSubmit() {
  if (componentRef.value) {
    await componentRef.value.submit();
  }
}

const { can: canForPath } = useAasAbility({
  getAccessPermissionRules: props.editorContext.getAccessPermissionRules,
});

function canEditPath(path: string): boolean {
  return canForPath(Permissions.Edit, path);
}
</script>

<template>
  <Drawer
    v-model:visible="visible"
    :position="position"
    :class="{
      'w-full! md:w-80! lg:w-1/2!': !isFullPosition,
      'w-full!': isFullPosition,
    }"
    :pt="{
      mask: { class: 'aas-editor-drawer-mask' },
    }"
    :auto-z-index="false"
    @hide="props.hideDrawer"
  >
    <template #header>
      <div class="flex w-full flex-row items-center justify-between gap-1 pr-2">
        <h2 class="text-xl font-bold">{{ props.drawerHeader }}</h2>
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
            v-if="showSaveButton"
            :label="
              props.editorVNode?.component === SubmodelElementListCreateEditor
                ? t('aasEditor.table.saveAndAddEntries')
                : t('common.save')
            "
            @click="onSubmit"
          />
        </div>
      </div>
    </template>
    <template #default>
      <Tabs :value="activeDrawerTab">
        <TabList>
          <Tab data-cy="drawer-tab-data" value="data">{{ t("aasEditor.drawerTabs.data") }}</Tab>
          <Tab v-if="showPresentationTab" data-cy="drawer-tab-presentation" value="presentation">
            {{ t("aasEditor.drawerTabs.presentation") }}
          </Tab>
          <Tab
            v-if="activityHistoryPath"
            value="activityHistory"
            data-cy="drawer-tab-activityHistory"
          >
            {{ t("activityHistory.label") }}
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="data">
            <component
              :is="props.editorVNode.component"
              v-if="props.editorVNode"
              :key="props.editorVNode.props.path.idShortPathIncludingSubmodel ?? ''"
              v-bind="props.editorVNode.props"
              :id="props.editorContext.id"
              ref="componentRef"
              :aas-namespace="props.editorContext.aasNamespace"
              :open-drawer="props.editorContext.openDrawer"
              :error-handling-store="props.editorContext.errorHandlingStore"
              :translate="t"
              :get-access-permission-rules="props.editorContext.getAccessPermissionRules"
              :modify-shell="props.editorContext.modifyShell"
              :delete-policy-by-subject-and-object="
                props.editorContext.deletePolicyBySubjectAndObject
              "
              :is-archived="props.editorContext.isArchived"
              :hide-drawer="props.hideDrawer"
            />
          </TabPanel>
          <TabPanel v-if="showPresentationTab" value="presentation">
            <ElementPresentationPanel
              :element="props.editorVNode!.props.data"
              :path="props.editorVNode!.props.path.idShortPathIncludingSubmodel!"
              :disabled="
                props.editorContext.isArchived ||
                !canEditPath(props.editorVNode!.props.path.idShortPathIncludingSubmodel!)
              "
            />
          </TabPanel>
          <TabPanel v-if="activityHistoryPath" value="activityHistory">
            <EditorActivityHistory
              v-if="props.editorVNode && props.editorVNode.props.path.idShortPathIncludingSubmodel"
              :id="props.editorContext.id"
              :path="activityHistoryPath"
              :type="props.editorContext.type"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </Drawer>
</template>

<style>
.aas-editor-drawer-mask {
  z-index: 51;
}
</style>
