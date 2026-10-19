import { describe, expect, it } from "vitest";
import { DigitalProductDocumentStatusDto } from "@open-dpp/dto";
import { makeDayPeriod } from "../lib/day-period.ts";
import { useListFilterState } from "./list-filter-state.ts";

const startOfJan1 = new Date(2022, 0, 1);
const endOfFeb1 = new Date(2022, 1, 1);

describe("useListFilterState", () => {
  it("has no filter by default", () => {
    const { filter, hasActiveFilters } = useListFilterState();
    expect(filter.value).toEqual({});
    expect(hasActiveFilters.value).toBe(false);
  });

  it("derives the API filter from the initial state", () => {
    const period = makeDayPeriod(startOfJan1, endOfFeb1);
    const { filter, hasActiveFilters } = useListFilterState({
      status: [DigitalProductDocumentStatusDto.Published],
      templateIds: ["t1"],
      period,
    });
    expect(filter.value).toEqual({
      status: [DigitalProductDocumentStatusDto.Published],
      templateIds: ["t1"],
      ...period.toIsoRange(),
    });
    expect(hasActiveFilters.value).toBe(true);
  });

  it("updates the filter when the state changes and clears it on reset", () => {
    const { templateIds, period, filter, reset } = useListFilterState();
    templateIds.value = ["t2"];
    period.value = makeDayPeriod(startOfJan1);
    expect(filter.value.templateIds).toEqual(["t2"]);
    expect(filter.value.startDate).toBeDefined();

    reset();

    expect(templateIds.value).toEqual([]);
    expect(period.value).toBeNull();
    expect(filter.value).toEqual({});
  });

  it("does not share state between instances", () => {
    const a = useListFilterState({ templateIds: ["t1"] });
    const b = useListFilterState();
    expect(b.templateIds.value).toEqual([]);
    a.reset();
    expect(a.templateIds.value).toEqual([]);
  });
});
