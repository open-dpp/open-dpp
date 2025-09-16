<template>
  <ul>
    <li
      class="border-t border-gray-100"
      v-for="(_, index) in rows"
      :key="index"
      :data-cy="`row-${index}`"
    >
      <div
        v-if="rowInEditMode !== index"
        class="flex justify-between items-center"
      >
        <div>Datenreihe {{ index }}</div>
        <BaseButton variant="primary" @click="rowInEditMode = index"
          >Editieren</BaseButton
        >
      </div>
      <SectionForm v-else :section="props.section" :row="index" />
    </li>
  </ul>
</template>
<script setup lang="ts">
import { DataSectionDto } from "@open-dpp/api-client";
import { computed, ref } from "vue";
import BaseButton from "../../BaseButton.vue";
import SectionForm from "./SectionForm.vue";
import { usePassportFormStore } from "../../../stores/passport.form";

const productPassportStore = usePassportFormStore();

const props = defineProps<{
  section: DataSectionDto;
}>();

const rows = computed(() => {
  const dataValues = props.section.dataValues;
  if (dataValues.length > 0) {
    return dataValues;
  }
  const subSections = productPassportStore.findSubSections(props.section.id);
  if (subSections.length > 0 && subSections[0].dataValues.length > 0) {
    return subSections[0].dataValues;
  }
  return [];
});

const rowInEditMode = ref<number>(0);
</script>
