import { ref, watch } from "vue";
import type { PeriodRange } from "./digital-product-document-list-filter.ts";

// Range mode emits a list, the type of the DatePicker model also allows a single date.
type PickerValue = Date | Array<Date | null> | null | undefined;

function isSamePeriod(a: PeriodRange | null, b: PeriodRange | null): boolean {
  if (!a || !b) return a === b;
  return a[0].getTime() === b[0].getTime() && a[1]?.getTime() === b[1]?.getTime();
}

/**
 * A range DatePicker emits while the user is still picking (start set, end still null, time
 * not yet adjusted). The filter is only committed when the picker closes or is cleared, so
 * the list is not reloaded for every click.
 */
export function usePeriodInput(
  committed: () => PeriodRange | null,
  commit: (period: PeriodRange | null) => void,
) {
  const draft = ref<PickerValue>(committed());

  watch(committed, (value) => {
    draft.value = value;
  });

  function toPeriod(value: PickerValue): PeriodRange | null {
    if (value instanceof Date) return [value, null];
    const start = value?.[0];
    return start ? [start, value?.[1] ?? null] : null;
  }

  function commitDraft() {
    const period = toPeriod(draft.value);
    if (!isSamePeriod(period, committed())) {
      commit(period);
    }
  }

  function onInput(value: PickerValue) {
    draft.value = value ?? null;
    if (!toPeriod(draft.value)) {
      commitDraft();
    }
  }

  return { draft, onInput, onHide: commitDraft };
}
