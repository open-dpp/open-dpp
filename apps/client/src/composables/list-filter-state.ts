import type { DigitalProductDocumentStatusDtoType, PassportFilterParamsDto } from "@open-dpp/dto";
import { computed, ref, shallowRef } from "vue";
import type { DayPeriod } from "../lib/day-period.ts";

export interface ListFilterInitialState {
  status?: DigitalProductDocumentStatusDtoType[];
  templateIds?: string[];
  period?: DayPeriod | null;
}

/**
 * The plain state of a passport / template list filter (status, templates, created-at period)
 * and the API filter derived from it. Where the state lives (URL query, dialog) is up to the caller.
 */
export function useListFilterState(initial: ListFilterInitialState = {}) {
  const status = ref<DigitalProductDocumentStatusDtoType[]>(initial.status ?? []);
  const templateIds = ref<string[]>(initial.templateIds ?? []);
  // A period is an immutable object that is replaced as a whole, so it needs no deep reactivity.
  const period = shallowRef<DayPeriod | null>(initial.period ?? null);

  const filter = computed<PassportFilterParamsDto>(() => ({
    ...(status.value.length > 0 && { status: status.value }),
    ...(templateIds.value.length > 0 && { templateIds: templateIds.value }),
    ...period.value?.toIsoRange(),
  }));

  const hasActiveFilters = computed(() => Object.keys(filter.value).length > 0);

  function reset() {
    status.value = [];
    templateIds.value = [];
    period.value = null;
  }

  return { status, templateIds, period, filter, hasActiveFilters, reset };
}
