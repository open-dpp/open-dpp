<script setup lang="ts">
import type { DataSectionDto } from "@open-dpp/api-client";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { usePassportFormStore } from "../../../stores/passport.form";
import BaseButton from "../../basics/BaseButton.vue";
import SectionForm from "./SectionForm.vue";

const props = defineProps<{
  section: DataSectionDto;
}>();
const { t } = useI18n();
const productPassportStore = usePassportFormStore();

const rows = computed(() => {
  const dataValues = props.section.dataValues;
  if (dataValues.length > 0) {
    return dataValues;
  }
  const subSections = productPassportStore.findSubSections(props.section.id);
  if (subSections.length > 0 && (subSections[0] as DataSectionDto).dataValues.length > 0) {
    return (subSections[0] as DataSectionDto).dataValues;
  }
  return [];
});

const rowInEditMode = ref<number>(0);
</script>

<template>
  <ul>
    <li
      v-for="(_, index) in rows"
      :key="index"
      class="border-t border-gray-100"
      :data-cy="`row-${index}`"
    >
      <div
        v-if="rowInEditMode !== index"
        class="flex justify-between items-center"
      >
        <div>
          {{ `${t('models.form.repeater.series')} ${index}` }}
        </div>
        <BaseButton variant="primary" @click="rowInEditMode = index">
          {{
            t('common.edit')
          }}
        </BaseButton>
      </div>
      <SectionForm v-else :section="props.section" :row="index" />
    </li>
  </ul>
</template>
