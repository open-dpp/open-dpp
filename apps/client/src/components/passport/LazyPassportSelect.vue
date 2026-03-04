<script setup lang="ts">
import type { PassportDto } from "@open-dpp/dto";
import { Select } from "primevue";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAasUtils } from "../../composables/aas-utils";
import { usePagination } from "../../composables/pagination";
import { usePassports } from "../../composables/passports";
import { convertLocaleToLanguage } from "../../translations/i18n";

const { startSize = 10, disabled = false } = defineProps<{
  startSize?: number;
  disabled?: boolean;
}>();

const model = defineModel<PassportDto>();

const { t, locale } = useI18n();
type PassportOption = PassportDto & { label: string };
const passportList = ref<PassportOption[]>([]);
const passport = computed({
  get: () => {
    return model.value?.id;
  },
  set: (updateId: string) => {
    model.value = passportList.value.find(
      passport => passport.id === updateId,
    );
  },
});

const { passports, loading, fetchPassports } = usePassports();

const { hasNext, nextPage } = usePagination({
  limit: startSize,
  fetchCallback: fetchPassports,
  changeQueryParams: () => {},
});

async function loadMorePassports() {
  if (hasNext.value) {
    await nextPage();
    if (passports.value) {
      passportList.value.push(
        ...passports.value.result.map(passport => ({
          ...passport,
          label: getOptionLabel(passport),
        })),
      );
    }
  }
}

const { parseDisplayNameFromEnvironment } = useAasUtils({
  translate: t,
  selectedLanguage: convertLocaleToLanguage(locale.value),
});

function getOptionLabel(option: PassportDto): string {
  const displayName = parseDisplayNameFromEnvironment(option.environment);
  return displayName !== t("common.untitled") ? displayName : option.id;
}

async function onTemplateLazyLoad(e: { last: number }) {
  if (e.last >= passportList.value.length - 1) {
    await loadMorePassports();
  }
}

onMounted(async () => {
  await nextPage();
  if (passports.value) {
    passportList.value.push(
      ...passports.value.result.map(passport => ({
        ...passport,
        label: getOptionLabel(passport),
      })),
    );
  }
});
</script>

<template>
  <Select
    v-model="passport"
    class="w-96"
    :options="passportList"
    option-value="id"
    option-label="label"
    :virtual-scroller-options="{
      itemSize: 40,
      lazy: true,
      onLazyLoad: onTemplateLazyLoad,
    }"
    :placeholder="t('passports.select')"
    :disabled="loading || disabled"
  />
</template>
