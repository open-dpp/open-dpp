<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>

<template>
  <dl>
    <div v-if="$slots.oldValue">
      <DescriptionTerm :dt="t('activityHistory.oldValue')">
        <slot name="oldValue" />
      </DescriptionTerm>
    </div>
    <div v-if="$slots.newValue">
      <DescriptionTerm :dt="t('activityHistory.newValue')">
        <slot name="newValue" />
      </DescriptionTerm>
    </div>
  </dl>
</template>

<style scoped></style>
