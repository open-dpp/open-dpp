<script lang="ts" setup>
import type { TemplateDraftCreateDto } from "@open-dpp/api-client";
import { Sector } from "@open-dpp/api-client";

const emits = defineEmits<{
  (e: "submit", draftData: TemplateDraftCreateDto): void;
}>();

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
      help="Geben Sie Ihrer Passvorlage einen Namen"
      label="Name"
      name="name"
      type="text"
      validation="required"
    />
    <form-kit
      data-cy="description"
      help="Geben Sie Ihrer Passvorlage eine Beschreibung"
      label="Beschreibung"
      name="description"
      type="text"
      validation="required"
    />
    <form-kit
      data-cy="sectors"
      name="sectors"
      type="checkbox"
      label="Branchen"
      :options="[
        {
          value: Sector.BATTERY,
          label: 'Batterie',
        },
        { value: Sector.CONSTRUCTION, label: 'Bau' },
        { value: Sector.MINING, label: 'Bergbau' },
        { value: Sector.ELECTRONICS, label: 'Elektronik' },
        { value: Sector.TRADE, label: 'Handel' },
        { value: Sector.HEALTHCARE, label: 'Gesundheit' },
        { value: Sector.AGRICULTURE, label: 'Landwirtschaft' },
        { value: Sector.EDUCATION, label: 'Lehre' },
        { value: Sector.AEROSPACE, label: 'Luftfahrt' },
        { value: Sector.MACHINERY, label: 'Maschinenbau' },
        { value: Sector.MEDICAL, label: 'Medizin' },
        { value: Sector.TEXTILE, label: 'Textil' },
        { value: Sector.OTHER, label: 'Sonstiges' },
      ]"
      help="Wählen Sie mindestens eine Branche aus, für die Ihre Passvorlage angewendet werden kann."
      validation="required|min:1"
    />
    <form-kit label="Erstellen" type="submit" />
  </form-kit>
</template>
