<script setup lang="ts">
import type { PropertyResponseDto, SubmodelElementModificationDto } from "@open-dpp/dto";
import type {
  AasEditorPath,
  SubmodelElementListEditorProps,
} from "../../composables/aas-drawer.ts";
import type { IAasEditor } from "../../composables/aas-editor.ts";
import { DataTypeDef, PropertyJsonSchema, SubmodelElementCollectionJsonSchema } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { Button, Column, DataTable, Menu } from "primevue";
import { useForm } from "vee-validate";
import { computed, ref } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { useAasList } from "../../composables/aas-list.ts";
import {
  SubmodelBaseFormSchema,
} from "../../lib/submodel-base-form.ts";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<{
  path: AasEditorPath;
  data: SubmodelElementListEditorProps;
  callback: (data: SubmodelElementModificationDto) => Promise<void>;
  aasEditor: IAasEditor;
}>();

const popover = ref();

console.log(props.aasEditor.submodels);

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
  : [
      { idShort: "id", valueType: DataTypeDef.String },
      { idShort: "name", valueType: DataTypeDef.String },
    ].map(v => PropertyJsonSchema.parse(v)));

const rows = [
  { id: "id1", name: "name1" },

];

const { columnsToAdd } = useAasList({ path: props.path, initialList: props.data, aasEditor: props.aasEditor });

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

function addColumn(index: number) {
  columns.value.splice(index, 0, PropertyJsonSchema.parse({ idShort: "id2", valueType: DataTypeDef.String }));
}
</script>

<template>
  <form class="flex flex-col gap-1 p-2">
    <SubmodelBaseForm :show-errors="showErrors" :errors="errors" :editor-mode="EditorMode.EDIT" />
    <DataTable scrollable :value="rows" table-style="min-width: 50rem">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xl font-bold">Einträge</span>
          <Button label="Spalte hinzufügen" />
        </div>
      </template>
      <Column v-for="(col, index) of columns" :key="col.idShort" :field="col.idShort">
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
