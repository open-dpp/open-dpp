import { ref, watch } from "vue";
import { type DayPeriod, makeDayPeriod } from "../lib/day-period.ts";

// Range mode emits a list, the type of the DatePicker model also allows a single date.
type PickerValue = Date | Array<Date | null> | null | undefined;

/**
 * A range DatePicker emits while the user is still picking (start set, end still null). The
 * filter is only committed when the picker closes or is cleared, so the list is not reloaded
 * for every click.
 */
export function usePeriodInput(
  committed: () => DayPeriod | null,
  commit: (period: DayPeriod | null) => void,
) {
  const draft = ref<PickerValue>(committed()?.toPickerValue());

  watch(committed, (value) => {
    draft.value = value?.toPickerValue() ?? null;
  });

  function commitDraft() {
    const period = makeDayPeriod.fromPicker(draft.value);
    if (!makeDayPeriod.areEqual(period, committed())) {
      commit(period);
    }
  }

  function onInput(value: PickerValue) {
    draft.value = value ?? null;
    if (!makeDayPeriod.fromPicker(draft.value)) {
      commitDraft();
    }
  }

  return { draft, onInput, onHide: commitDraft };
}
