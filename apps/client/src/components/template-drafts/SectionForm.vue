<script lang="ts" setup>
import type {
  SectionDto,
} from "@open-dpp/api-client";
import {
  GranularityLevel,
  SectionType,
} from "@open-dpp/api-client";
import { ref, watch } from "vue";
import { z } from "zod/v4";
import { useDraftStore } from "../../stores/draft";
import { useDraftSidebarStore } from "../../stores/draftSidebar";
import { useModelDialogStore } from "../../stores/modal.dialog";
import BaseButton from "../BaseButton.vue";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const props = defineProps<{
  type: SectionType;
  parentId?: string;
  parentGranularityLevel?: GranularityLevel;
  id?: string;
}>();

const formData = ref<Record<string, unknown>>({});
const formSchema = ref();
const sectionToModify = ref<SectionDto | undefined>();
const draftStore = useDraftStore();
const draftSidebarStore = useDraftSidebarStore();
const modelDialogStore = useModelDialogStore();

function formSchemaFromType(type: SectionType, existingGranularityLevel: GranularityLevel | undefined) {
  const granularityOptions = {
    [GranularityLevel.MODEL]: t('builder.granularity.model'),
    [GranularityLevel.ITEM]: t('builder.granularity.item'),
  };

  const dataSectionFormkitSchema = [];
  dataSectionFormkitSchema.push({
    $formkit: 'text',
    name: 'name',
    label: t('builder.name'),
    'data-cy': 'name',
  });

  if (!existingGranularityLevel && type === SectionType.REPEATABLE) {
    dataSectionFormkitSchema.push({
      $formkit: 'select',
      name: 'granularityLevel',
      label: t('builder.granularityLevel'),
      options: granularityOptions,
      'data-cy': 'select-granularity-level',
    });
  }
  return dataSectionFormkitSchema;
}

watch(
  [() => props.type, () => props.id], // The store property to watch
  ([newType, newId]) => {
    const dataSection = newId ? draftStore.findSectionById(newId) : undefined;
    formSchema.value = formSchemaFromType(
      newType,
      dataSection?.granularityLevel ?? props.parentGranularityLevel,
    );
    if (dataSection) {
      sectionToModify.value = dataSection;
      formData.value = {
        name: sectionToModify.value.name,
        granularityLevel: sectionToModify.value.granularityLevel,
      };
    }
  },
  { immediate: true }, // Optional: to run the watcher immediately when the component mounts
);

async function onDelete() {
  modelDialogStore.open(
    {
      title: t('builder.delete.label'),
      description: t('builder.delete.description'),
      type: 'warning',
    },
    async () => {
      if (sectionToModify.value) {
        await draftStore.deleteSection(sectionToModify.value.id);
        draftSidebarStore.close();
      }
    },
  );
}

async function onSubmit() {
  const data = z
    .object({
      name: z.string(),
      granularityLevel: z.enum(GranularityLevel).optional(),
    })
    .parse({
      granularityLevel: props.parentGranularityLevel,
      ...formData.value,
    });
  if (sectionToModify.value) {
    await draftStore.modifySection(sectionToModify.value.id, {
      name: data.name,
    });
  }
  else {
    await draftStore.addSection({
      type: props.type,
      name: data.name,
      parentSectionId: props.parentId,
      granularityLevel: data.granularityLevel,
    });
  }
  draftSidebarStore.close();
}
</script>

<template>
  <div class="p-4">
    <FormKit
      id="repeatable-form"
      v-model="formData"
      :actions="false"
      type="form"
      @submit="onSubmit"
    >
      <FormKitSchema v-if="formSchema" :schema="formSchema" />
      <div class="flex gap-1">
        <BaseButton variant="primary" data-cy="submit" type="submit">
          {{ sectionToModify ? t('common.edit') : t('common.add') }}
        </BaseButton>
        <BaseButton
          v-if="sectionToModify"
          data-cy="delete"
          type="button"
          variant="error"
          @click="onDelete"
        >
          {{ t('builder.delete.label') }}
        </BaseButton>
      </div>
    </FormKit>
  </div>
</template>
