<script setup lang="ts">
import type { AasNamespace } from "@open-dpp/api-client";
import type { SubmodelElementModificationDto } from "@open-dpp/dto";
import type {
  AasEditorPath,
  EditorType,
  OpenDrawerCallback,
  SubmodelElementListEditorProps,
} from "../../composables/aas-drawer.ts";
import type { BuildColumnsToAddOptions } from "../../composables/aas-table-extension.ts";
import type { IErrorHandlingStore } from "../../stores/error.handling.ts";
import { toTypedSchema } from "@vee-validate/zod";
import { Button, Column, DataTable, Menu } from "primevue";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { useForm } from "vee-validate";
import { computed, ref, toRaw } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { useAasTableExtension } from "../../composables/aas-table-extension.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<{
  path: AasEditorPath;
  data: SubmodelElementListEditorProps;
  callback: (data: SubmodelElementModificationDto) => Promise<void>;
  openDrawer: OpenDrawerCallback<EditorType, "CREATE" | "EDIT">;
  aasNamespace: AasNamespace;
  errorHandlingStore: IErrorHandlingStore;
  id: string;
  translate: (label: string, ...args: unknown[]) => string;
}>();

const popover = ref();

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

const { columnsToAdd, columns, buildColumnsToAdd } = useAasTableExtension({
  id: props.id,
  pathToList: toRaw(props.path),
  openDrawer: props.openDrawer,
  initialData: props.data,
  selectedLanguage: convertLocaleToLanguage(locale.value),
  errorHandlingStore: props.errorHandlingStore,
  translate: props.translate,
  openConfirm: confirm.require,
  aasNamespace: props.aasNamespace,
});

const rows = [{ id: "id1", name: "name1" }];

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

const submit = handleSubmit(async (data) => {
  await props.callback({ ...data });
});

defineExpose<{
  submit: () => Promise<Promise<void> | undefined>;
}>({
  submit,
});

function addClicked(event: any, options: BuildColumnsToAddOptions) {
  buildColumnsToAdd(options);
  popover.value.toggle(event);
}
</script>

<template>
  <form class="flex flex-col gap-1 p-2">
    <SubmodelBaseForm
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.EDIT"
    />
    <ConfirmDialog />
    <DataTable scrollable :value="rows" table-style="min-width: 50rem">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xl font-bold">{{ t('aasEditor.table.entries') }}</span>
          <Button
            :label="t('aasEditor.table.addColumn')"
            @click="addClicked($event, { position: columns.length })"
          />
        </div>
      </template>
      <Column v-for="(col, index) of columns" :key="col.idShort" :field="col.idShort">
        <template #header>
          <Button icon="pi pi-ellipsis-v" severity="secondary" size="small" @click="addClicked($event, { position: index, addColumnActions: true })" />
          <span>{{ col.label }}</span>
        </template>
      </Column>
      <Column
        align-frozen="right"
        :frozen="true"
        header="Balance"
        style="max-width: 14px"
      >
        <template #body="">
          <div class="flex">
            <div class="flex items-center rounded-md gap-2">
              <Button icon="pi pi-plus" severity="primary" />
            </div>
          </div>
        </template>
      </Column>
    </DataTable>
    <Menu
      id="overlay_menu"
      ref="popover"
      :model="columnsToAdd"
      :popup="true"
      position="right"
    />
  </form>
</template>
