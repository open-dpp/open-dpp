import type { LocationQueryValue } from "vue-router";
import {
  DigitalProductDocumentStatusDtoEnum,
  type DigitalProductDocumentStatusDtoType,
} from "@open-dpp/dto";
import { useRoute, useRouter } from "vue-router";
import { type DayPeriod, makeDayPeriod } from "../lib/day-period.ts";
import { useListFilterState } from "./list-filter-state.ts";

type QueryValue = LocationQueryValue | LocationQueryValue[] | undefined;

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

function parsePeriod(startDate: QueryValue, endDate: QueryValue): DayPeriod | null {
  return makeDayPeriod.fromIso({
    startDate: toStringArray(startDate)[0],
    endDate: toStringArray(endDate)[0],
  });
}

/**
 * Filter of the passport and template overviews (status, created-at period and, for
 * passports, templates). The state lives in the URL query so that reloading the page keeps it.
 * Callers have to reset the pagination cursor after a change.
 */
export function useDigitalProductDocumentListFilter(options: { withTemplateIds?: boolean } = {}) {
  const route = useRoute();
  const router = useRouter();

  const { status, templateIds, period, filter, hasActiveFilters, reset } = useListFilterState({
    status: parseStatuses(route.query.status),
    templateIds: options.withTemplateIds ? toStringArray(route.query.templateId) : [],
    period: parsePeriod(route.query.startDate, route.query.endDate),
  });

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

  async function setPeriod(newPeriod: DayPeriod | null | undefined) {
    period.value = newPeriod ?? null;
    await writeQuery();
  }

  async function resetFilter() {
    reset();
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
    reset: resetFilter,
  };
}
