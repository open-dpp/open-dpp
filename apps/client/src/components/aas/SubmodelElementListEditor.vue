<script setup lang="ts">
import type { SubmodelElementListModificationDto } from "@open-dpp/dto";
import type { SubmodelElementListEditorProps } from "../../composables/aas-drawer.ts";
import type { ColumnMenuOptions, RowMenuOptions } from "../../composables/aas-table-extension.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { AasSubmodelElements, DataTypeDef, Permissions } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { useConfirm } from "primevue/useconfirm";
import { useForm } from "vee-validate";
import { computed, onErrorCaptured, ref, toRaw } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import { useAasAbility } from "../../composables/aas-ability.ts";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { useAasTableExtension } from "../../composables/aas-table-extension.ts";
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
  onCellEditComplete,
  buildColumnMenu,
  buildRowMenu,
  formatCellValue,
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
onErrorCaptured((err) => {
  props.errorHandlingStore.logErrorWithNotification(t("common.errorOccurred"), err);
  return false; // stops error from bubbling further
});

const missingPermissionsMsg = t("aasEditor.security.missingPermission");
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
    <DataTable
      scrollable
      edit-mode="cell"
      data-key="idShort"
      :value="rows"
      @cell-edit-complete="
        (event) =>
          onCellEditComplete({
            data: event.data,
            field: event.field,
            index: event.index,
            newValue: event.newValue,
          })
      "
    >
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
      <Column class="w-12 font-bold" frozen>
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
      <Column v-for="(col, index) of columns" :key="col.idShort" :field="col.idShort">
        <template #header>
          <div class="flex items-center gap-2">
            <Button
              :data-cy="`column-menu-${col.idShort}`"
              :aria-label="t('common.actions')"
              icon="pi pi-ellipsis-v"
              severity="secondary"
              size="small"
              @click="
                toggleColumnMenu($event, {
                  position: index,
                  addColumnActions: true,
                })
              "
            />
            <span>{{ col.label }}</span>
          </div>
        </template>
        <template #body="{ data: cellData, field, index: rowIndex }">
          <span v-if="typeof field !== 'string'">N/A</span>
          <div v-else>
            <FileField
              v-if="
                canEdit &&
                col.plain.modelType === AasSubmodelElements.File &&
                rowsContext[rowIndex] != null &&
                rowsContext[rowIndex][field] != null
              "
              :id="`${rowIndex}-${field}`"
              v-model:content-type="rowsContext[rowIndex][field].contentType"
              :disabled="!canEdit"
              :model-value="cellData[field]"
              @update:model-value="(value) => onFileChange(value, cellData, rowIndex, field)"
            />
            <MediaFieldView
              v-else-if="
                !canEdit &&
                col.plain.modelType === AasSubmodelElements.File &&
                cellData[field] != null
              "
              :media-id="cellData[field]"
            />
            <PropertyValue
              v-else-if="
                canEdit &&
                col.plain.modelType === AasSubmodelElements.Property &&
                (col.plain.valueType === DataTypeDef.Date ||
                  col.plain.valueType === DataTypeDef.DateTime)
              "
              :id="`${rowIndex}-${field}`"
              :model-value="cellData[field]"
              :value-type="col.plain.valueType"
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
                (col.plain.modelType === AasSubmodelElements.Property ||
                  col.plain.modelType === AasSubmodelElements.ReferenceElement) &&
                cellData[field] != null
              "
            >
              {{ formatCellValue(cellData[field], col) }}
            </span>
            <InputText v-else autofocus fluid readonly :disabled="!canEdit" />
          </div>
        </template>
        <template
          v-if="
            canEdit &&
            col.plain.modelType !== AasSubmodelElements.File &&
            !(
              col.plain.modelType === AasSubmodelElements.Property &&
              (col.plain.valueType === DataTypeDef.Date ||
                col.plain.valueType === DataTypeDef.DateTime)
            )
          "
          #editor="{ data: editorData, field, index: rowIndex }"
        >
          <PropertyValue
            v-if="col.plain.modelType === AasSubmodelElements.Property"
            :id="`${rowIndex}-${field}`"
            v-model="editorData[field]"
            :value-type="col.plain.valueType"
          />
          <LinkCellField
            v-else-if="col.plain.modelType === AasSubmodelElements.ReferenceElement"
            :id="`${rowIndex}-${field}`"
            v-model="editorData[field]"
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
