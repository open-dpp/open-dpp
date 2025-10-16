<script setup lang="ts">
import type { DataSectionDto } from "@open-dpp/api-client";
import { SectionType } from "@open-dpp/api-client";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { usePassportFormStore } from "../stores/passport.form";
import BaseButton from "./BaseButton.vue";
import BaseSectionHeader from "./BaseSectionHeader.vue";

const props = defineProps<{
  section: DataSectionDto;
}>();
const { t } = useI18n();
const passportFormStore = usePassportFormStore();

const disabledMessage = computed(() => {
  if (
    props.section.granularityLevel
    && props.section.granularityLevel !== passportFormStore.granularityLevel
  ) {
    return passportFormStore.getValueForOtherGranularityLevel();
  }
  return undefined;
});

async function onAddRow() {
  await passportFormStore.addRowToSection(props.section.id);
}
</script>

<template>
  <BaseSectionHeader :section="props.section">
    <template #actions>
      <BaseButton
        v-if="!disabledMessage && section.type === SectionType.REPEATABLE"
        variant="primary"
        @click="onAddRow"
      >
        {{ t('models.form.repeater.addSeries') }}
      </BaseButton>
      <div
        v-if="disabledMessage"
        class="m-2 text-sm/6 font-medium text-gray-900"
      >
        {{ disabledMessage }}
      </div>
    </template>
  </BaseSectionHeader>
</template>
