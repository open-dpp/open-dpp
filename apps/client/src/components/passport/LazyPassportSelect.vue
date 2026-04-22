<script setup lang="ts">
import {
  DigitalProductDocumentStatusDto,
  type PagingParamsDto,
  type PassportDto,
  type PassportPaginationDto,
  type TemplateDto,
  type TemplatePaginationDto,
} from "@open-dpp/dto";
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
    model.value = passportList.value.find((passport) => passport.id === updateId);
  },
});

const { passports, loading, fetchPassports } = usePassports();

function fetchCallback(pagingParams: PagingParamsDto) {
  return fetchPassports(pagingParams, {
    status: [DigitalProductDocumentStatusDto.Draft, DigitalProductDocumentStatusDto.Published],
  });
}

const { hasNext, nextPage } = usePagination({
  limit: startSize,
  fetchCallback,
  changeQueryParams: () => {},
});

async function loadMorePassports() {
  if (hasNext.value) {
    await nextPage();
    if (passports.value) {
      passportList.value.push(...constructPassports(passports.value));
    }
  }
}

const { parseDisplayNameFromEnvironment } = useAasUtils({
  translate: t,
  selectedLanguage: convertLocaleToLanguage(locale.value),
});

function constructPassports({ result }: PassportPaginationDto) {
  return result.map((passport) => ({
    ...passport,
    label: getOptionLabel(passport),
    status: getOptionStatus(passport),
  }));
}

function getOptionLabel(option: PassportDto): string {
  const displayName = parseDisplayNameFromEnvironment(option.environment);
  return displayName !== t("common.untitled") ? displayName : option.id;
}

function getOptionStatus(option: PassportDto): string {
  return t(`status.${option.lastStatusChange.currentStatus.toLowerCase()}`);
}

async function onPassportLazyLoad(e: { last: number }) {
  if (e.last >= passportList.value.length - 1) {
    await loadMorePassports();
  }
}

onMounted(async () => {
  await nextPage();
  if (passports.value) {
    passportList.value.push(...constructPassports(passports.value));
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
      onLazyLoad: onPassportLazyLoad,
    }"
    :placeholder="t('passports.select')"
    :disabled="loading || disabled"
  >
    <template #option="slotProps">
      <div class="flex items-center gap-2">
        <div class="text-xl">{{ slotProps.option.label }}</div>
        <Tag severity="secondary" :value="slotProps.option.status" />
      </div>
    </template>
  </Select>
</template>
