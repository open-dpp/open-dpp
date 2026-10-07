import { describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import { type DayPeriod, makeDayPeriod } from "../lib/day-period.ts";
import { usePeriodInput } from "./period-input.ts";

describe("usePeriodInput", () => {
  // Local dates, because a period covers whole days in the timezone of the user.
  const start = new Date(2022, 0, 1);
  const end = new Date(2022, 1, 1);

  function setup(initial: DayPeriod | null = null) {
    const committed = ref<DayPeriod | null>(initial);
    const commit = vi.fn((period: DayPeriod | null) => {
      committed.value = period;
    });
    return { committed, commit, ...usePeriodInput(() => committed.value, commit) };
  }

  it("does not commit while the range is still being picked", () => {
    const { onInput, commit, draft } = setup();
    onInput([start, null]);
    expect(draft.value).toEqual([start, null]);
    expect(commit).not.toHaveBeenCalled();
  });

  it("commits the draft as a period of whole days when the picker closes", () => {
    const { onInput, onHide, commit } = setup();
    onInput([start, end]);
    onHide();
    expect(commit).toHaveBeenCalledOnce();
    expect(commit.mock.calls[0]?.[0]?.toPickerValue()).toEqual([
      start,
      new Date(2022, 1, 1, 23, 59, 59, 999),
    ]);
  });

  it("treats the same days with other times as unchanged", () => {
    const { onInput, onHide, commit } = setup(makeDayPeriod(start, end));
    onInput([new Date(2022, 0, 1, 10), new Date(2022, 1, 1, 8)]);
    onHide();
    expect(commit).not.toHaveBeenCalled();
  });

  it("commits an open-ended range with only a start", () => {
    const { onInput, onHide, commit } = setup();
    onInput([start, null]);
    onHide();
    expect(commit).toHaveBeenCalledOnce();
    expect(commit.mock.calls[0]?.[0]?.end).toBeNull();
  });

  it("does not commit again when nothing changed", () => {
    const { onHide, commit } = setup(makeDayPeriod(start, end));
    onHide();
    expect(commit).not.toHaveBeenCalled();
  });

  it("commits immediately when the range is cleared", () => {
    const { onInput, commit } = setup(makeDayPeriod(start, end));
    onInput(null);
    expect(commit).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("follows the committed value, e.g. after the filters are reset", async () => {
    const { committed, draft } = setup(makeDayPeriod(start, end));
    committed.value = null;
    await nextTick();
    expect(draft.value).toBeNull();
  });
});
