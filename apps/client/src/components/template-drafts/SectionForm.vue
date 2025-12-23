<script lang="ts" setup>
import type { SectionDto } from "@open-dpp/api-client";
import { GranularityLevel, SectionType } from "@open-dpp/api-client";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod/v4";
import { useDraftStore } from "../../stores/draft";
import { useDraftSidebarStore } from "../../stores/draftSidebar";
import { useModelDialogStore } from "../../stores/modal.dialog";

const props = defineProps<{
  type: SectionType;
  parentId?: string;
  parentGranularityLevel?: GranularityLevel;
  id?: string;
}>();

const { t } = useI18n();
const formData = ref<{
  name: string;
  granularityLevel?: GranularityLevel;
}>({
  name: "",
});
const sectionToModify = ref<SectionDto | undefined>();
const draftStore = useDraftStore();
const draftSidebarStore = useDraftSidebarStore();
const modelDialogStore = useModelDialogStore();

const granularityOptions = computed(() => [
  { label: t("builder.granularity.model"), value: GranularityLevel.MODEL },
  { label: t("builder.granularity.item"), value: GranularityLevel.ITEM },
]);

watch(
  [() => props.type, () => props.id],
  ([_, newId]) => {
    const dataSection = newId ? draftStore.findSectionById(newId) : undefined;
    if (dataSection) {
      sectionToModify.value = dataSection;
      formData.value = {
        name: sectionToModify.value.name,
        granularityLevel: sectionToModify.value.granularityLevel,
      };
    }
    else {
      sectionToModify.value = undefined;
      formData.value = { name: "" };
    }
  },
  { immediate: true },
);

async function onDelete() {
  modelDialogStore.open(
    {
      title: t("builder.delete.label"),
      description: t("builder.delete.description"),
      type: "warning",
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
  if (!formData.value.name) {
    return; // Or handle error
  }

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
    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <div class="flex flex-col gap-2">
        <label for="name" class="block text-sm font-medium text-gray-700">
          {{ t("builder.name") }}
        </label>
        <InputText
          id="name"
          v-model="formData.name"
          type="text"
          required
          class="w-full"
          data-cy="name"
        />
      </div>

      <div
        v-if="!sectionToModify?.granularityLevel && !parentGranularityLevel && type === SectionType.REPEATABLE"
        class="flex flex-col gap-2"
      >
        <label for="granularityLevel" class="block text-sm font-medium text-gray-700">
          {{ t("builder.granularityLevel") }}
        </label>
        <Select
          id="granularityLevel"
          v-model="formData.granularityLevel"
          :options="granularityOptions"
          option-label="label"
          option-value="value"
          class="w-full"
          data-cy="select-granularity-level"
          placeholder="Select Granularity"
        />
      </div>

      <div class="flex gap-2">
        <Button
          type="submit"
          :label="sectionToModify ? t('common.edit') : t('common.add')"
          data-cy="submit"
        />
        <Button
          v-if="sectionToModify"
          type="button"
          severity="danger"
          :label="t('builder.delete.label')"
          data-cy="delete"
          @click="onDelete"
        />
      </div>
    </form>
  </div>
</template>
