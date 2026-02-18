<script setup lang="ts">
import type { SubmodelElementListModificationDto } from "@open-dpp/dto";
import type { SubmodelElementListEditorProps } from "../../composables/aas-drawer.ts";
import type {
  ColumnMenuOptions,
  RowMenuOptions,
} from "../../composables/aas-table-extension.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { AasSubmodelElements } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { Button, Column, DataTable, InputText, Menu } from "primevue";
import { useConfirm } from "primevue/useconfirm";
import { useForm } from "vee-validate";
import { computed, ref, toRaw } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { useAasTableExtension } from "../../composables/aas-table-extension.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import FileField from "./form/FileField.vue";
import PropertyValue from "./PropertyValue.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props
  = defineProps<
    SharedEditorProps<
      SubmodelElementListEditorProps,
      SubmodelElementListModificationDto
    >
  >();

const columnMenuPopover = ref();
const rowMenuPopover = ref();

const propertyFormSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
});

export type FormValues = z.infer<typeof propertyFormSchema>;

const { handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(propertyFormSchema),
  initialValues: {
    ...props.data,
  },
});

const { t, locale } = useI18n();

const confirm = useConfirm();

const {
  columnMenu,
  rowMenu,
  rows,
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
});

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

async function submit() {
  await handleSubmit(async (data) => {
    await save();
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
</script>

<template>
  <form class="flex flex-col gap-1 p-2">
    <SubmodelBaseForm
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.EDIT"
    />
    <DataTable
      scrollable
      edit-mode="cell"
      :value="rows"
      @cell-edit-complete="onCellEditComplete"
    >
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xl font-bold">{{
            t("aasEditor.table.entries")
          }}</span>
          <Button
            :label="t('aasEditor.table.addColumnEnd')"
            @click="toggleColumnMenu($event, { position: columns.length })"
          />
        </div>
      </template>
      <Column style="width: 10px" frozen class="font-bold">
        <template #body="{ index }">
          <div class="flex">
            <div class="flex items-center rounded-md gap-2">
              <Button
                icon="pi pi-ellipsis-v"
                severity="secondary"
                size="small"
                @click="toggleRowMenu($event, { position: index })"
              />
            </div>
          </div>
        </template>
      </Column>
      <Column
        v-for="(col, index) of columns"
        :key="col.idShort"
        :field="col.idShort"
      >
        <template #header>
          <Button
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
        </template>
        <template #body="{ data: cellData, field, index: rowIndex }">
          <div v-if="typeof field === 'string' && cellData[field] != null && cellData[field] !== ''">
            <FileField
              v-if="col.plain.modelType === AasSubmodelElements.File"
              :id="`${rowIndex}-${field}`"
              v-model="cellData[field].value"
              v-model:content-type="cellData[field].contentType"
              @update:model-value="
                (value) =>
                  onCellEditComplete({
                    data: cellData,
                    newValue: {
                      value,
                      contentType: cellData[field].contentType,
                    },
                    field,
                    index: rowIndex,
                  })
              "
            />
            <span v-else>
              {{ formatCellValue(cellData[field], col) }}
            </span>
          </div>
          <InputText v-else autofocus fluid readonly />
        </template>
        <template
          v-if="col.plain.modelType !== AasSubmodelElements.File"
          #editor="{ data: editorData, field, index: rowIndex }"
        >
          <PropertyValue
            :id="`${rowIndex}-${field}`"
            v-model="editorData[field]"
            :value-type="col.plain.valueType"
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
  </form>
</template>
