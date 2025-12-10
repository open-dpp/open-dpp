<script lang="ts" setup>
import type { TemplateGetAllDto } from "@open-dpp/api-client";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{ templates: TemplateGetAllDto[] }>();
const emits = defineEmits<{
  (e: "submit", selectedProductDataModelId: string, modelName: string): void;
}>();
const { t } = useI18n();
const selectableDataModels = props.templates.map(p => ({
  label: `${p.name} ${p.version}`,
  value: p.id,
}));

const name = ref("");
const productDataModelId = ref("");
const errors = ref<{ name?: string; productDataModelId?: string }>({});

function validate() {
  errors.value = {};
  let isValid = true;
  if (!name.value) {
    errors.value.name = "Required"; // Or t('validation.required') if available
    isValid = false;
  }
  if (!productDataModelId.value) {
    errors.value.productDataModelId = "Required";
    isValid = false;
  }
  return isValid;
}

function create() {
  if (validate()) {
    emits("submit", productDataModelId.value, name.value);
  }
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="create">
    <div class="flex flex-col gap-2">
      <label for="name" class="block text-sm font-medium text-gray-700">
        {{ t('models.form.name.label') }}
      </label>
      <InputText
        id="name"
        v-model="name"
        type="text"
        :invalid="!!errors.name"
        class="w-full"
        data-cy="name"
      />
      <small v-if="errors.name" class="text-red-600">{{ errors.name }}</small>
      <small v-else class="text-gray-500">{{ t('models.form.name.help') }}</small>
    </div>

    <div class="flex flex-col gap-2">
      <label for="productDataModelId" class="block text-sm font-medium text-gray-700">
        {{ t('models.form.passportDraft.label') }}
      </label>
      <Select
        id="productDataModelId"
        v-model="productDataModelId"
        :options="selectableDataModels"
        option-label="label"
        option-value="value"
        :invalid="!!errors.productDataModelId"
        class="w-full"
        data-cy="productDataModelId"
        placeholder="Select a template"
      />
      <small v-if="errors.productDataModelId" class="text-red-600">{{ errors.productDataModelId }}</small>
      <small v-else class="text-gray-500">{{ t('models.form.passportDraft.help') }}</small>
    </div>

    <div class="mt-4">
      <Button :label="t('common.create')" type="submit" />
    </div>
  </form>
</template>
