<template>
  <BaseSectionHeader :section="props.section">
    <template #actions>
      <BaseButton
        variant="primary"
        v-if="!disabledMessage && section.type === SectionType.REPEATABLE"
        @click="onAddRow"
        >{{ t('models.form.repeater.addSeries') }}</BaseButton
      >
      <div
        class="m-2 text-sm/6 font-medium text-gray-900"
        v-if="disabledMessage"
      >
        {{ disabledMessage }}
      </div>
    </template>
  </BaseSectionHeader>
</template>

<script setup lang="ts">
import { DataSectionDto, SectionType } from '@open-dpp/api-client';
import { usePassportFormStore } from '../stores/passport.form';
import BaseSectionHeader from './BaseSectionHeader.vue';
import { computed } from 'vue';
import BaseButton from './BaseButton.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  section: DataSectionDto;
}>();

const passportFormStore = usePassportFormStore();

const disabledMessage = computed(() => {
  if (
    props.section.granularityLevel &&
    props.section.granularityLevel !== passportFormStore.granularityLevel
  ) {
    return passportFormStore.getValueForOtherGranularityLevel();
  }
  return undefined;
});

const onAddRow = async () => {
  await passportFormStore.addRowToSection(props.section.id);
};
</script>
