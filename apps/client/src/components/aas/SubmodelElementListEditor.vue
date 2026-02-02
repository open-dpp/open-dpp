<script setup lang="ts">
import type { AasNamespace } from "@open-dpp/api-client";
import type { PropertyResponseDto, SubmodelElementModificationDto } from "@open-dpp/dto";
import type {
  AasEditorPath,
  EditorType,
  OpenDrawerCallback,
  SubmodelElementListEditorProps,
} from "../../composables/aas-drawer.ts";
import type { IErrorHandlingStore } from "../../stores/error.handling.ts";
import { PropertyJsonSchema, SubmodelElementCollectionJsonSchema } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { Button, Column, DataTable, Menu } from "primevue";
import { useForm } from "vee-validate";
import { computed, ref, toRaw } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { useAasTableExtension } from "../../composables/aas-table-extension.ts";
import {
  SubmodelBaseFormSchema,
} from "../../lib/submodel-base-form.ts";
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

const columns = ref<PropertyResponseDto[]>(props.data.value.length > 0
  ? SubmodelElementCollectionJsonSchema.parse(props.data.value[0]).value.map(v => PropertyJsonSchema.parse(v))
  : []);

const { columnsToAdd } = useAasTableExtension({
  id: props.id,
  pathToList: toRaw(props.path),
  openDrawer: props.openDrawer,
  errorHandlingStore: props.errorHandlingStore,
  translate: props.translate,
  aasNamespace: props.aasNamespace,
});

const rows = [
  { id: "id1", name: "name1" },

];

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

function addClicked(event: any) {
  popover.value.toggle(event);
}
</script>

<template>
  <form class="flex flex-col gap-1 p-2">
    <SubmodelBaseForm :show-errors="showErrors" :errors="errors" :editor-mode="EditorMode.EDIT" />
    <DataTable scrollable :value="rows" table-style="min-width: 50rem">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xl font-bold">Einträge</span>
          <Button label="Spalte hinzufügen" @click="addClicked($event)" />
        </div>
      </template>
      <Column v-for="(col) of columns" :key="col.idShort" :field="col.idShort">
        <template #header>
          <span>{{ col.idShort }}</span>
          <Button
            icon="pi pi-plus"
            size="small"
            @click="addClicked($event)"
          />
        </template>
      </Column>
      <Column align-frozen="right" :frozen="true" header="Balance" style="max-width: 14px">
        <template #body="">
          <div class="flex">
            <div class="flex items-center rounded-md gap-2">
              <Button
                icon="pi pi-plus"
                severity="primary"
              />
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
