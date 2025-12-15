<script lang="ts" setup>
import type { TemplateDraftCreateDto } from "@open-dpp/api-client";
import { Sector } from "@open-dpp/api-client";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const emits = defineEmits<{
  (e: "submit", draftData: TemplateDraftCreateDto): void;
}>();

const { t } = useI18n();

const name = ref("");
const description = ref("");
const sectors = ref<Sector[]>([]);
const errors = ref<{ name?: string; description?: string; sectors?: string }>({});

const sectorOptions = [
  { value: Sector.BATTERY, label: t("draft.form.sectors.battery") },
  { value: Sector.CONSTRUCTION, label: t("draft.form.sectors.construction") },
  { value: Sector.MINING, label: t("draft.form.sectors.mining") },
  { value: Sector.ELECTRONICS, label: t("draft.form.sectors.electronics") },
  { value: Sector.TRADE, label: t("draft.form.sectors.trade") },
  { value: Sector.HEALTHCARE, label: t("draft.form.sectors.healthcare") },
  { value: Sector.AGRICULTURE, label: t("draft.form.sectors.agriculture") },
  { value: Sector.EDUCATION, label: t("draft.form.sectors.education") },
  { value: Sector.AEROSPACE, label: t("draft.form.sectors.aerospace") },
  { value: Sector.MACHINERY, label: t("draft.form.sectors.machinery") },
  { value: Sector.MEDICAL, label: t("draft.form.sectors.medical") },
  { value: Sector.TEXTILE, label: t("draft.form.sectors.textile") },
  { value: Sector.OTHER, label: t("draft.form.sectors.other") },
];

function validate() {
  errors.value = {};
  let isValid = true;
  if (!name.value) {
    errors.value.name = t("validation.required");
    isValid = false;
  }
  if (!description.value) {
    errors.value.description = t("validation.required");
    isValid = false;
  }
  if (sectors.value.length === 0) {
    errors.value.sectors = t("validation.required"); // Or a more specific message if available
    isValid = false;
  }
  return isValid;
}

function submit() {
  if (validate()) {
    emits("submit", {
      name: name.value,
      description: description.value,
      sectors: sectors.value,
    });
  }
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <div class="flex flex-col gap-2">
      <label for="name" class="block text-sm font-medium text-gray-700">
        {{ t('draft.form.name.label') }}
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
      <small v-else class="text-gray-500">{{ t('draft.form.name.help') }}</small>
    </div>

    <div class="flex flex-col gap-2">
      <label for="description" class="block text-sm font-medium text-gray-700">
        {{ t('draft.form.description.label') }}
      </label>
      <InputText
        id="description"
        v-model="description"
        type="text"
        :invalid="!!errors.description"
        class="w-full"
        data-cy="description"
      />
      <small v-if="errors.description" class="text-red-600">{{ errors.description }}</small>
      <small v-else class="text-gray-500">{{ t('draft.form.description.help') }}</small>
    </div>

    <div class="flex flex-col gap-2">
      <label class="block text-sm font-medium text-gray-700">
        {{ t('draft.form.sectors.label') }}
      </label>
      <div class="flex flex-col gap-2" data-cy="sectors">
        <div v-for="option in sectorOptions" :key="option.value" class="flex items-center gap-2">
          <Checkbox
            v-model="sectors"
            :input-id="option.value"
            :value="option.value"
            name="sectors"
            :invalid="!!errors.sectors"
          />
          <label :for="option.value" class="text-sm text-gray-700">{{ option.label }}</label>
        </div>
      </div>
      <small v-if="errors.sectors" class="text-red-600">{{ errors.sectors }}</small>
      <small v-else class="text-gray-500">{{ t('draft.form.sectors.help') }}</small>
    </div>

    <div class="mt-4">
      <Button :label="t('draft.create')" type="submit" />
    </div>
  </form>
</template>
