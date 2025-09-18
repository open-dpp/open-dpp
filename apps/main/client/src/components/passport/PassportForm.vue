<template>
  <div
    v-if="passportFormStore.productPassport"
    class="mb-4 grid grid-cols-1 gap-4"
  >
    <div v-if="!currentSections.isRootLevel" class="flex items-center gap-2">
      <div>Datenreihe {{ row }}</div>
      <BaseButton variant="primary" @click="navigateBackToHome"
        >Zur Startseite</BaseButton
      >
      <BaseButton
        variant="primary"
        v-if="currentSections.parentSection"
        @click="navigateBackToParent"
        >Zurück zu {{ currentSections.parentSection.name }}</BaseButton
      >
    </div>
    <div
      v-for="section of currentSections.sections"
      :key="section.id"
      :data-cy="`section-card-${section.id}`"
      class="overflow-hidden bg-white shadow sm:rounded-lg w-full"
    >
      <SectionHeader :section="section" />
      <div
        v-if="
          section.granularityLevel === passportFormStore.granularityLevel ||
          !section.granularityLevel
        "
        class="p-4"
      >
        <RepeatableSection
          v-if="section.type === SectionType.REPEATABLE"
          :section="section"
        />
        <SectionForm v-else :section="section" :row="row" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePassportFormStore } from '../../stores/passport.form';
import SectionForm from './form-components/SectionForm.vue';
import SectionHeader from '../SectionHeader.vue';
import RepeatableSection from './form-components/RepeatableSection.vue';
import { SectionType } from '@open-dpp/api-client';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseButton from '../BaseButton.vue';

const passportFormStore = usePassportFormStore();
const route = useRoute();
const router = useRouter();

const row = computed(() => {
  return route.query.row ? Number(route.query.row) : 0;
});

const currentSections = computed(() => {
  const foundSection = route.query.sectionId
    ? passportFormStore.findSectionById(String(route.query.sectionId))
    : undefined;
  return {
    isRootLevel: !foundSection,
    sections: foundSection
      ? [foundSection]
      : passportFormStore.findSubSections(undefined),
    parentSection: foundSection?.parentId
      ? passportFormStore.findSectionById(foundSection.parentId)
      : undefined,
  };
});

const navigateBackToParent = () => {
  router.push(
    `?sectionId=${currentSections.value.parentSection?.id}&row=${row.value}`,
  );
};

const navigateBackToHome = () => {
  router.push(`?sectionId=${undefined}`);
};
</script>
