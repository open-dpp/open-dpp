import {
  DigitalProductDocumentStatusDto,
  type PagingParamsDto,
  type TemplateDto,
  type TemplatePaginationDto,
} from "@open-dpp/dto";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useAasUtils } from "./aas-utils.ts";
import { usePagination } from "./pagination.ts";
import { useTemplates } from "./templates.ts";

export type TemplateOption = { id: string; label: string; status: string };

/**
 * Lazily loaded (Draft and Published) template options for the template selects. Loads the first
 * page on mount and the next pages while the user scrolls the options.
 */
export function useTemplateOptions(isDisabled: () => boolean = () => false) {
  const { t } = useI18n();
  const { parseDisplayNameFromEnvironment } = useAasUtils();
  const errorHandlingStore = useErrorHandlingStore();
  const { templates, loading, fetchTemplates } = useTemplates();

  const options = ref<TemplateOption[]>([]);

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

  function getOptionLabel(template: TemplateDto): string {
    const displayName = parseDisplayNameFromEnvironment(template.environment);
    return displayName !== t("common.untitled") ? displayName : template.id;
  }

  function getOptionStatus(template: TemplateDto): string {
    return t(`status.${template.lastStatusChange.currentStatus.toLowerCase()}`);
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
        options.value.push(...constructTemplateOptions(templates.value));
      }
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("templates.errorFetchList"), error);
    }
  }

  async function onLazyLoad(e: { last: number }) {
    if (e.last >= options.value.length - 1 && hasNext.value) {
      await fetchAndAppendPage();
    }
  }

  // Props shared by the PrimeVue Select and MultiSelect rendering the options.
  const selectProps = computed(() => ({
    options: options.value,
    optionValue: "id",
    optionLabel: "label",
    loading: loading.value,
    disabled: isDisabled() || loading.value,
    virtualScrollerOptions: {
      itemSize: 40,
      lazy: true,
      onLazyLoad,
    },
  }));

  onMounted(fetchAndAppendPage);

  return { options, loading, selectProps, onLazyLoad };
}
