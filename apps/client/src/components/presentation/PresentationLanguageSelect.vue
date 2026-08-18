<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { LanguageType } from "@open-dpp/dto";
import { storeToRefs } from "pinia";
import { usePassportStore } from "../../stores/passport";
import { useSubmodelTree } from "../../composables/submodel-tree";
import { usePresentationLanguage } from "../../composables/presentation-language";

const { locale } = useI18n();
const passportStore = usePassportStore();
const { submodels } = storeToRefs(passportStore);
const { languageTags } = useSubmodelTree(submodels);
const presentationLanguage = usePresentationLanguage();

const languageNames = computed(() => new Intl.DisplayNames([locale.value], { type: "language" }));

const options = computed(() =>
  [...languageTags.value].map((tag) => ({
    tag,
    description: (() => {
      try {
        return languageNames.value.of(tag) ?? tag;
      } catch {
        return tag;
      }
    })(),
  })),
);

const selectedLanguage = computed({
  get: () => presentationLanguage?.value,
  set: (val: LanguageType | undefined) => {
    if (presentationLanguage && val !== undefined) {
      presentationLanguage.value = val;
    }
  },
});

const isSearchable = computed(() => options.value.length > 5);
</script>

<template>
  <Select
    v-if="presentationLanguage && options.length > 1"
    v-model="selectedLanguage"
    :options="options"
    option-value="tag"
    option-label="description"
    :filter="isSearchable"
    size="small"
  >
    <template #value="{ value }">
      <span class="uppercase sm:hidden">{{ value }}</span>
      <span class="hidden sm:inline">{{
        options.find((o) => o.tag === value)?.description ?? value
      }}</span>
    </template>
  </Select>
</template>
