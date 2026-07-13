<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { LanguageType } from "@open-dpp/dto";
import { useLanguageSelect } from "../../composables/language";

const { ignoreOptions, disabled = false } = defineProps<{
  ignoreOptions: string[];
  disabled?: boolean;
}>();
const model = defineModel<LanguageType>();
const { t } = useI18n();
const filter = ref("");

const { languageItems } = useLanguageSelect();
const items = languageItems(() => ignoreOptions, filter);

const options = computed(() => {
  const groups = [];

  if (items.value.preferredItems.length > 0) {
    groups.push({
      label: t("language.preferred"),
      items: items.value.preferredItems,
    });
  }

  if (items.value.allItems.length > 0) {
    groups.push({
      label: t("language.all"),
      items: items.value.allItems,
    });
  }

  return groups;
});
</script>

<template>
  <Select
    v-model="model"
    :disabled="disabled"
    :options="options"
    filter
    @filter="filter = $event.value"
    option-value="key"
    option-label="description"
    option-group-children="items"
    option-group-label="label"
    placeholder="Select a Language"
  />
</template>

<style scoped></style>
