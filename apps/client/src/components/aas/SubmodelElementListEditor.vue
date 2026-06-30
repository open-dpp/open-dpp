<script setup lang="ts">
import type { SubmodelElementListModificationDto } from "@open-dpp/dto";
import { AasSubmodelElements, DataTypeDef, Permissions } from "@open-dpp/dto";
import type { SubmodelElementListEditorProps } from "../../composables/aas-drawer.ts";
import { EditorMode } from "../../composables/aas-drawer.ts";
import type {
  ColumnMenuOptions,
  FlatColumn,
  RowMenuOptions,
} from "../../composables/aas-table-extension.ts";
import { useAasTableExtension } from "../../composables/aas-table-extension.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { toTypedSchema } from "@vee-validate/zod";
import { useConfirm } from "primevue/useconfirm";
import { useForm } from "vee-validate";
import { computed, onErrorCaptured, ref, toRaw, watch } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import { useAasAbility } from "../../composables/aas-ability.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import FileField from "./form/FileField.vue";
import FormContainer from "./form/FormContainer.vue";
import LinkCellField from "./LinkCellField.vue";
import PropertyValue from "./PropertyValue.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props =
  defineProps<
    SharedEditorProps<SubmodelElementListEditorProps, SubmodelElementListModificationDto>
  >();

const columnMenuPopover = ref();
const rowMenuPopover = ref();

const propertyFormSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
});

export type FormValues = z.infer<typeof propertyFormSchema>;

const { handleSubmit, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(propertyFormSchema),
  initialValues: {
    ...props.data,
  },
});

const { t, locale } = useI18n();

const permissionsFormRef = ref<{
  savePermissions: () => Promise<void>;
} | null>(null);

const { can } = useAasAbility({
  getAccessPermissionRules: props.getAccessPermissionRules,
});

const idShortPathList = computed(() => props.path.idShortPathIncludingSubmodel ?? "");

const canCreateColumnsAndRows = computed(() => {
  return !props.isArchived && can(Permissions.Create, idShortPathList.value);
});

const canEdit = computed(() => {
  return !props.isArchived && can(Permissions.Edit, idShortPathList.value);
});

const canDeleteColumnsAndRows = computed(() => {
  return !props.isArchived && can(Permissions.Delete, idShortPathList.value);
});

const confirm = useConfirm();

const {
  columnMenu,
  rowMenu,
  rows,
  rowsContext,
  columns,
  flatColumns,
  hasGroups,
  onCellEditComplete,
  buildColumnMenu,
  buildRowMenu,
  formatCellValue,
  resolveField,
  setField,
  save,
} = useAasTableExtension({
  id: props.id,
  pathToList: toRaw(props.path),
  openDrawer: props.openDrawer,
  callbackOfSubmodelElementListEditor: props.callback,
  initialData: props.data,
  selectedLanguage: convertLocaleToLanguage(locale.value),
  errorHandlingStore: props.errorHandlingStore,
  translate: props.translate,
  openConfirm: confirm.require,
  aasNamespace: props.aasNamespace,
  disableRowCreation: !canCreateColumnsAndRows.value,
  disableColumnCreation: !canCreateColumnsAndRows.value,
  disableRowDeletion: !canDeleteColumnsAndRows.value,
  disableColumnDeletion: !canDeleteColumnsAndRows.value,
  disableColumnEditing: !canEdit.value,
});

const showErrors = computed(() => submitCount.value > 0);

async function submit() {
  await handleSubmit(async (data) => {
    try {
      if (permissionsFormRef.value) {
        await permissionsFormRef.value.savePermissions();
      }
      await save();
    } catch (e) {
      props.errorHandlingStore.logErrorWithNotification(t("aasEditor.table.errorEditEntries"), e);
    }
    await props.callback({ ...data });
  })();
}

defineExpose<{
  submit: () => Promise<void>;
}>({
  submit,
});

function toggleRowMenu(event: any, options: RowMenuOptions) {
  buildRowMenu(options);
  rowMenuPopover.value.toggle(event);
}

function toggleColumnMenu(event: any, options: ColumnMenuOptions) {
  buildColumnMenu(options);
  columnMenuPopover.value.toggle(event);
}

function onFileChange(value: string | undefined, cellData: any, rowIndex: number, field: string) {
  onCellEditComplete({
    data: cellData,
    newValue: value ?? null,
    field,
    index: rowIndex,
  });
}

function resolveContext(rowIndex: number, field: string): any {
  return rowsContext.value[rowIndex]?.[field];
}

onErrorCaptured((err) => {
  props.errorHandlingStore.logErrorWithNotification(t("common.errorOccurred"), err);
  return false; // stops error from bubbling further
});

watch(
  () => flatColumns.value,
  async (newValue) => {
    console.log(newValue);
  },
  { immediate: true, deep: true },
);

console.log(rows.value);

const missingPermissionsMsg = t("aasEditor.security.missingPermission");
const sales = ref([{ product: "3", bla: "blub", blub: "19" }]);
</script>

<template>
  <div class="flex flex-col gap-1 p-2">
    <FormContainer>
      <SubmodelBaseForm
        :show-errors="showErrors"
        :editor-mode="EditorMode.EDIT"
        :disabled="!canEdit"
      />
      <PermissionsForm
        ref="permissionsFormRef"
        :disabled="!canEdit"
        :path="props.path"
        :modify-shell="props.modifyShell"
        :get-access-permission-rules="props.getAccessPermissionRules"
        :delete-policy-by-subject-and-object="props.deletePolicyBySubjectAndObject"
      />
    </FormContainer>
    <DataTable :value="sales" tableStyle="min-width: 50rem" showGridlines>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-xl font-bold">{{ t("aasEditor.table.entries") }}</h3>
          <Button
            v-tooltip.top="!canCreateColumnsAndRows ? missingPermissionsMsg : undefined"
            :label="t('aasEditor.table.addColumnEnd')"
            :disabled="!canCreateColumnsAndRows"
            @click="toggleColumnMenu($event, { position: columns.length })"
          />
        </div>
      </template>

      <!-- Multi-row header when groups are present -->
      <ColumnGroup type="header">
        <Row>
          Row action column spans both header rows
          <Column :rowspan="2" :colspan="1" />
          <Column
            v-for="(col, colIndex) in columns"
            :key="col.idShort"
            :colspan="col.children ? col.children.length : 1"
            :rowspan="col.children ? 1 : 2"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <Button
                  v-if="col.children"
                  :data-cy="`column-menu-${col.idShort}`"
                  :aria-label="t('common.actions')"
                  icon="pi pi-ellipsis-v"
                  severity="secondary"
                  size="small"
                  @click="
                    toggleColumnMenu($event, {
                      position: colIndex,
                      isGroupHeader: true,
                      groupIdShort: col.idShort,
                    })
                  "
                />
                <Button
                  v-else
                  :data-cy="`column-menu-${col.idShort}`"
                  :aria-label="t('common.actions')"
                  icon="pi pi-ellipsis-v"
                  severity="secondary"
                  size="small"
                  @click="
                    toggleColumnMenu($event, {
                      position: colIndex,
                      addColumnActions: true,
                    })
                  "
                />
                <span>{{ col.label }}</span>
              </div>
            </template>
          </Column>
        </Row>
        <!-- Sub-column header row -->
        <Row>
          <template v-for="col in columns" :key="col.idShort">
            <Column
              v-for="(subCol, subColIndex) in col.children"
              :key="`${col.idShort}_${subCol.idShort}`"
            >
              <template #header>
                <div class="flex items-center gap-2">
                  <Button
                    :data-cy="`column-menu-${col.idShort}-${subCol.idShort}`"
                    :aria-label="t('common.actions')"
                    icon="pi pi-ellipsis-v"
                    severity="secondary"
                    size="small"
                    @click="
                      toggleColumnMenu($event, {
                        position: subColIndex,
                        addColumnActions: true,
                        groupIdShort: col.idShort,
                      })
                    "
                  />
                  <span>{{ subCol.label }}</span>
                </div>
              </template>
            </Column>
          </template>
        </Row>
      </ColumnGroup>

      <!-- Row action button column -->

      <Column class="w-12 font-bold">
        <template #body="{ index }">
          <div class="flex items-center gap-2 rounded-md">
            <Button
              :data-cy="`row-menu-${index}`"
              :aria-label="t('common.actions')"
              icon="pi pi-ellipsis-v"
              severity="secondary"
              size="small"
              @click="toggleRowMenu($event, { position: index })"
            />
          </div>
        </template>
      </Column>

      <!--      Data columns (flat, groups expanded into their sub-columns)-->
      <Column
        v-for="(flatCol, flatIndex) in flatColumns"
        :key="flatCol.field"
        :field="flatCol.field"
      >
        <!-- Header only shown when no ColumnGroup is active -->
        <template v-if="!hasGroups" #header>
          <div class="flex items-center gap-2">
            <Button
              :data-cy="`column-menu-${flatCol.idShort}`"
              :aria-label="t('common.actions')"
              icon="pi pi-ellipsis-v"
              severity="secondary"
              size="small"
              @click="
                toggleColumnMenu($event, {
                  position: flatIndex,
                  addColumnActions: true,
                })
              "
            />
            <span>{{ flatCol.label }}</span>
          </div>
        </template>
        <template #body="{ data: cellData, field, index: rowIndex }">
          <span v-if="typeof field !== 'string'">N/A</span>
          <div v-else>
            <FileField
              v-if="
                canEdit &&
                flatCol.plain.modelType === AasSubmodelElements.File &&
                resolveContext(rowIndex, field) != null
              "
              :id="`${rowIndex}-${field}`"
              v-model:content-type="resolveContext(rowIndex, field).contentType"
              :disabled="!canEdit"
              :model-value="resolveField(cellData, field) ?? undefined"
              @update:model-value="(value) => onFileChange(value, cellData, rowIndex, field)"
            />
            <MediaFieldView
              v-else-if="
                !canEdit &&
                flatCol.plain.modelType === AasSubmodelElements.File &&
                resolveField(cellData, field) != null
              "
              :media-id="resolveField(cellData, field)!"
            />
            <PropertyValue
              v-else-if="
                canEdit &&
                flatCol.plain.modelType === AasSubmodelElements.Property &&
                (flatCol.plain.valueType === DataTypeDef.Date ||
                  flatCol.plain.valueType === DataTypeDef.DateTime ||
                  flatCol.plain.valueType === DataTypeDef.Boolean)
              "
              :id="`${rowIndex}-${field}`"
              :model-value="resolveField(cellData, field)"
              :value-type="flatCol.plain.valueType"
              withinList
              @update:model-value="
                (value) =>
                  onCellEditComplete({
                    data: cellData,
                    newValue: value ?? null,
                    field,
                    index: rowIndex,
                  })
              "
            />
            <span
              v-else-if="
                flatCol.plain.modelType === AasSubmodelElements.Property &&
                resolveField(cellData, field) != null
              "
            >
              {{ formatCellValue(resolveField(cellData, field) as string, flatCol) }}
            </span>
            <InputText v-else autofocus fluid readonly :disabled="!canEdit" />
          </div>
        </template>
        <template
          v-if="
            canEdit &&
            flatCol.plain.modelType !== AasSubmodelElements.File &&
            !(
              flatCol.plain.modelType === AasSubmodelElements.Property &&
              (flatCol.plain.valueType === DataTypeDef.Date ||
                flatCol.plain.valueType === DataTypeDef.DateTime ||
                flatCol.plain.valueType === DataTypeDef.Boolean)
            )
          "
          #editor="{ data: editorData, field, index: rowIndex }"
        >
          <PropertyValue
            v-if="flatCol.plain.modelType === AasSubmodelElements.Property"
            :id="`${rowIndex}-${field}`"
            :model-value="resolveField(editorData, field)"
            :value-type="flatCol.plain.valueType"
            withinList
            @update:model-value="(value) => setField(editorData, field, value ?? null)"
          />
        </template>
      </Column>
    </DataTable>
    <Menu
      id="overlay_column_menu"
      ref="columnMenuPopover"
      :model="columnMenu"
      :popup="true"
      position="right"
    />
    <Menu
      id="overlay_row_menu"
      ref="rowMenuPopover"
      :model="rowMenu"
      :popup="true"
      position="right"
    />
  </div>
</template>
