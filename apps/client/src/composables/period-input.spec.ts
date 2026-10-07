import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { nextTick } from "vue";
import type { PeriodRange } from "./digital-product-document-list-filter.ts";
import { usePeriodInput } from "./period-input.ts";

describe("usePeriodInput", () => {
  const start = new Date("2022-01-01T00:00:00.000Z");
  const end = new Date("2022-02-01T00:00:00.000Z");

  function setup(initial: PeriodRange | null = null) {
    const committed = ref<PeriodRange | null>(initial);
    const commit = vi.fn((period: PeriodRange | null) => {
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

  it("commits the draft when the picker closes", () => {
    const { onInput, onHide, commit } = setup();
    onInput([start, end]);
    onHide();
    expect(commit).toHaveBeenCalledExactlyOnceWith([start, end]);
  });

  it("commits an open-ended range with only a start", () => {
    const { onInput, onHide, commit } = setup();
    onInput([start, null]);
    onHide();
    expect(commit).toHaveBeenCalledExactlyOnceWith([start, null]);
  });

  it("does not commit again when nothing changed", () => {
    const { onHide, commit } = setup([start, end]);
    onHide();
    expect(commit).not.toHaveBeenCalled();
  });

  it("commits immediately when the range is cleared", () => {
    const { onInput, commit } = setup([start, end]);
    onInput(null);
    expect(commit).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("follows the committed value, e.g. after the filters are reset", async () => {
    const { committed, draft } = setup([start, end]);
    committed.value = null;
    await nextTick();
    expect(draft.value).toBeNull();
  });
});
