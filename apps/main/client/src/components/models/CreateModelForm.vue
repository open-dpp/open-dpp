<template>
  <form-kit
    id="createProductForm"
    :actions="false"
    type="form"
    @submit="create"
  >
    <form-kit
      :allow-incomplete="false"
      :wrapper-class="{ 'w-full': true }"
      name="stepper"
      tab-style="tab"
      type="multi-step"
    >
      <form-kit
        :wrapper-class="{ 'w-full': true }"
        label="Allgemein"
        name="generalInfo"
        type="step"
      >
        <form-kit
          data-cy="name"
          help="Geben Sie Ihrem Modellpass einen Namen"
          label="Name"
          name="name"
          type="text"
          validation="required"
        />
        <form-kit
          :options="selectableDataModels"
          data-cy="productDataModelId"
          help="Wählen Sie die passende Passvorlage aus"
          label="Passvorlage"
          name="productDataModelId"
          type="select"
          validation="required"
        />
        <template #stepNext>
          <FormKit label="Erstellen" type="submit" />
        </template>
      </form-kit>
    </form-kit>
  </form-kit>
</template>

<script lang="ts" setup>
import { TemplateGetAllDto } from "@open-dpp/api-client";

const props = defineProps<{ templates: TemplateGetAllDto[] }>();
const selectableDataModels = props.templates.map((p) => ({
  label: `${p.name} ${p.version}`,
  value: p.id,
}));

const emits = defineEmits<{
  (e: "submit", selectedProductDataModelId: string, modelName: string): void;
}>();

const create = async (fields: {
  stepper: {
    generalInfo: {
      name: string;
      productDataModelId: string;
    };
  };
}) => {
  emits(
    "submit",
    fields.stepper.generalInfo.productDataModelId,
    fields.stepper.generalInfo.name,
  );
};
</script>
