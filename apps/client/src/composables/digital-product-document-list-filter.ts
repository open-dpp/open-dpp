import type { LocationQueryValue } from "vue-router";
import {
  DigitalProductDocumentStatusDtoEnum,
  type DigitalProductDocumentStatusDtoType,
  type PassportFilterParamsDto,
} from "@open-dpp/dto";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

type QueryValue = LocationQueryValue | LocationQueryValue[] | undefined;

// The PrimeVue range DatePicker models a range as [start, end | null].
export type PeriodRange = [Date, Date | null];

function toStringArray(value: QueryValue): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values.filter((v): v is string => typeof v === "string" && v.length > 0);
}

function parseStatuses(value: QueryValue): DigitalProductDocumentStatusDtoType[] {
  return toStringArray(value).flatMap((v) => {
    const parsed = DigitalProductDocumentStatusDtoEnum.safeParse(v);
    return parsed.success ? [parsed.data] : [];
  });
}

function parseDate(value: QueryValue): Date | null {
  const [first] = toStringArray(value);
  if (!first) return null;
  const date = new Date(first);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parsePeriod(startDate: QueryValue, endDate: QueryValue): PeriodRange | null {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  // Open-ended ranges without a start cannot be shown by the range picker.
  return start ? [start, end] : null;
}

/**
 * Filter of the passport and template overviews (status, created-at period and, for
 * passports, templates). The state lives in the URL query so that reloading the page keeps it.
 * Callers have to reset the pagination cursor after a change.
 */
export function useDigitalProductDocumentListFilter(options: { withTemplateIds?: boolean } = {}) {
  const route = useRoute();
  const router = useRouter();

  const status = ref<DigitalProductDocumentStatusDtoType[]>(parseStatuses(route.query.status));
  const templateIds = ref<string[]>(
    options.withTemplateIds ? toStringArray(route.query.templateId) : [],
  );
  const period = ref<PeriodRange | null>(parsePeriod(route.query.startDate, route.query.endDate));

  const filter = computed<PassportFilterParamsDto>(() => ({
    ...(status.value.length > 0 && { status: status.value }),
    ...(templateIds.value.length > 0 && { templateIds: templateIds.value }),
    ...(period.value && { startDate: period.value[0].toISOString() }),
    ...(period.value?.[1] && { endDate: period.value[1].toISOString() }),
  }));

  const hasActiveFilters = computed(() => Object.keys(filter.value).length > 0);

  async function writeQuery() {
    // The cursor belongs to the previous filter result, so it is dropped here.
    const { cursor: _cursor, ...query } = route.query;
    await router.replace({
      query: {
        ...query,
        status: status.value.length > 0 ? status.value : undefined,
        templateId: templateIds.value.length > 0 ? templateIds.value : undefined,
        startDate: filter.value.startDate,
        endDate: filter.value.endDate,
      },
    });
  }

  async function setStatus(newStatus: DigitalProductDocumentStatusDtoType[] | null | undefined) {
    status.value = newStatus ?? [];
    await writeQuery();
  }

  async function setTemplateIds(newTemplateIds: string[] | null | undefined) {
    templateIds.value = newTemplateIds ?? [];
    await writeQuery();
  }

  async function setPeriod(newPeriod: PeriodRange | null | undefined) {
    period.value = newPeriod?.[0] ? [newPeriod[0], newPeriod[1] ?? null] : null;
    await writeQuery();
  }

  async function reset() {
    status.value = [];
    templateIds.value = [];
    period.value = null;
    await writeQuery();
  }

  return {
    status,
    templateIds,
    period,
    filter,
    hasActiveFilters,
    setStatus,
    setTemplateIds,
    setPeriod,
    reset,
  };
}
