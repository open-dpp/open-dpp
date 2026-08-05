<script lang="ts" setup>
import {
  DigitalProductDocumentStatusDto,
  type PagingParamsDto,
  type TemplateDto,
  type TemplatePaginationDto,
} from "@open-dpp/dto";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAasUtils } from "../../composables/aas-utils.ts";
import { useTemplates } from "../../composables/templates";
import { usePagination } from "../../composables/pagination.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";

const { disabled = false } = defineProps<{
  disabled?: boolean;
}>();

const model = defineModel<string | null>();

const { t } = useI18n();
const { parseDisplayNameFromEnvironment } = useAasUtils();
const errorHandlingStore = useErrorHandlingStore();

type TemplateOption = { id: string; label: string; status: string };
const templateList = ref<TemplateOption[]>([]);

const { templates, loading, fetchTemplates } = useTemplates();

function fetchCallback(pagingParams: PagingParamsDto) {
  return fetchTemplates(pagingParams, {
    status: [DigitalProductDocumentStatusDto.Draft, DigitalProductDocumentStatusDto.Published],
  });
}

const { hasNext, nextPage } = usePagination({
  limit: 10,
  fetchCallback,
  changeQueryParams: () => {},
});

function getOptionLabel(option: TemplateDto): string {
  const displayName = parseDisplayNameFromEnvironment(option.environment);
  return displayName !== t("common.untitled") ? displayName : option.id;
}

function getOptionStatus(option: TemplateDto): string {
  return t(`status.${option.lastStatusChange.currentStatus.toLowerCase()}`);
}

function constructTemplateOptions({ result }: TemplatePaginationDto): TemplateOption[] {
  return result.map((template) => ({
    id: template.id,
    label: getOptionLabel(template),
    status: getOptionStatus(template),
  }));
}

async function fetchAndAppendPage() {
  try {
    await nextPage();
    if (templates.value) {
      templateList.value.push(...constructTemplateOptions(templates.value));
    }
  } catch (error) {
    errorHandlingStore.logErrorWithNotification(t("templates.errorFetchList"), error);
  }
}

async function loadMoreTemplates() {
  if (hasNext.value) {
    await fetchAndAppendPage();
  }
}

async function onTemplateLazyLoad(e: { last: number }) {
  if (e.last >= templateList.value.length - 1) {
    await loadMoreTemplates();
  }
}

onMounted(async () => {
  await fetchAndAppendPage();
});
</script>

<template>
  <Select
    v-model="model"
    :options="templateList"
    option-value="id"
    option-label="label"
    :loading="loading"
    :disabled="disabled || loading"
    :virtual-scroller-options="{
      itemSize: 40,
      lazy: true,
      onLazyLoad: onTemplateLazyLoad,
    }"
    :placeholder="t('templates.select')"
  >
    <template #option="slotProps">
      <div class="flex items-center gap-2">
        <div class="text-xl">{{ slotProps.option.label }}</div>
        <Tag severity="secondary" :value="slotProps.option.status" />
      </div>
    </template>
  </Select>
</template>
