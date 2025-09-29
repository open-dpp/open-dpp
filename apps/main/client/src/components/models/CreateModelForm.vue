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
        :label="t('models.general')"
        name="generalInfo"
        type="step"
      >
        <form-kit
          data-cy="name"
          :help="t('models.form.name.help')"
          :label="t('models.form.name.label')"
          name="name"
          type="text"
          validation="required"
        />
        <form-kit
          :options="selectableDataModels"
          data-cy="productDataModelId"
          :help="t('models.form.passportDraft.help')"
          :label="t('models.form.passportDraft.label')"
          name="productDataModelId"
          type="select"
          validation="required"
        />
        <template #stepNext>
          <FormKit :label="t('common.create')" type="submit" />
        </template>
      </form-kit>
    </form-kit>
  </form-kit>
</template>

<script lang="ts" setup>
import { TemplateGetAllDto } from '@open-dpp/api-client';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ templates: TemplateGetAllDto[] }>();
const selectableDataModels = props.templates.map((p) => ({
  label: `${p.name} ${p.version}`,
  value: p.id,
}));

const { t } = useI18n();

const emits = defineEmits<{
  (e: 'submit', selectedProductDataModelId: string, modelName: string): void;
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
    'submit',
    fields.stepper.generalInfo.productDataModelId,
    fields.stepper.generalInfo.name,
  );
};
</script>
