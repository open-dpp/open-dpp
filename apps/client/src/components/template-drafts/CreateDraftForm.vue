<script lang="ts" setup>
import type { TemplateDraftCreateDto } from "@open-dpp/api-client";
import { Sector } from "@open-dpp/api-client";
import { useI18n } from "vue-i18n";

const emits = defineEmits<{
  (e: "submit", draftData: TemplateDraftCreateDto): void;
}>();
const { t } = useI18n();
async function create(fields: {
  name: string;
  description: string;
  sectors: Sector[];
}) {
  emits("submit", {
    name: fields.name,
    description: fields.description,
    sectors: fields.sectors,
  });
}
</script>

<template>
  <form-kit id="createDraftForm" :actions="false" type="form" @submit="create">
    <form-kit
      data-cy="name"
      :help="t('draft.form.name.help')"
      :label="t('draft.form.name.label')"
      name="name"
      type="text"
      validation="required"
    />
    <form-kit
      data-cy="description"
      :help="t('draft.form.description.help')"
      :label="t('draft.form.description.label')"
      name="description"
      type="text"
      validation="required"
    />
    <form-kit
      data-cy="sectors"
      name="sectors"
      type="checkbox"
      :label="t('draft.form.sectors.label')"
      :options="[
        {
          value: Sector.BATTERY,
          label: t('draft.form.sectors.battery'),
        },
        {
          value: Sector.CONSTRUCTION,
          label: t('draft.form.sectors.construction'),
        },
        { value: Sector.MINING, label: t('draft.form.sectors.mining') },
        {
          value: Sector.ELECTRONICS,
          label: t('draft.form.sectors.electronics'),
        },
        { value: Sector.TRADE, label: t('draft.form.sectors.trade') },
        { value: Sector.HEALTHCARE, label: t('draft.form.sectors.healthcare') },
        {
          value: Sector.AGRICULTURE,
          label: t('draft.form.sectors.agriculture'),
        },
        { value: Sector.EDUCATION, label: t('draft.form.sectors.education') },
        { value: Sector.AEROSPACE, label: t('draft.form.sectors.aerospace') },
        { value: Sector.MACHINERY, label: t('draft.form.sectors.machinery') },
        { value: Sector.MEDICAL, label: t('draft.form.sectors.medical') },
        { value: Sector.TEXTILE, label: t('draft.form.sectors.textile') },
        { value: Sector.OTHER, label: t('draft.form.sectors.other') },
      ]"
      :help="t('draft.form.sectors.help')"
      validation="required|min:1"
    />
    <form-kit :label="t('draft.create')" type="submit" />
  </form-kit>
</template>
