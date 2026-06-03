<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ChangeEventDtoTypesType } from "@open-dpp/dto";

const props = defineProps<{ changeType: ChangeEventDtoTypesType }>();
const { t } = useI18n();
</script>

<template>
  <Fieldset
    class="w-full"
    :pt="{
      content: {
        class: 'wrap-anywhere',
      },
    }"
    :legend="t(`activityHistory.changeTypes.${props.changeType}`)"
    :toggleable="true"
  >
    <slot />
  </Fieldset>
</template>
