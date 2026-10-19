import { describe, expect, it } from "vitest";
import { makeDayPeriod } from "./day-period.ts";

// Local dates: a period covers whole days in the timezone of the user.
const startOfJan1 = new Date(2022, 0, 1);
const endOfJan5 = new Date(2022, 0, 5, 23, 59, 59, 999);

describe("dayPeriod", () => {
  it("spans from the start of the first to the end of the last day", () => {
    const period = makeDayPeriod(new Date(2022, 0, 1, 10, 30), new Date(2022, 0, 5, 8));
    expect(period.start).toEqual(startOfJan1);
    expect(period.end).toEqual(endOfJan5);
    expect(period.toPickerValue()).toEqual([startOfJan1, endOfJan5]);
    expect(period.toIsoRange()).toEqual({
      startDate: startOfJan1.toISOString(),
      endDate: endOfJan5.toISOString(),
    });
  });

  it("supports an open end", () => {
    const period = makeDayPeriod(new Date(2022, 0, 1, 10));
    expect(period.end).toBeNull();
    expect(period.toPickerValue()).toEqual([startOfJan1, null]);
    expect(period.toIsoRange()).toEqual({ startDate: startOfJan1.toISOString() });
  });

  it("compares by calendar days, not by times of day", () => {
    const period = makeDayPeriod(startOfJan1, endOfJan5);
    expect(period.isEqual(makeDayPeriod(new Date(2022, 0, 1, 12), new Date(2022, 0, 5)))).toBe(
      true,
    );
    expect(period.isEqual(makeDayPeriod(startOfJan1, new Date(2022, 0, 6)))).toBe(false);
    expect(period.isEqual(makeDayPeriod(new Date(2022, 0, 2), endOfJan5))).toBe(false);
    expect(period.isEqual(makeDayPeriod(startOfJan1))).toBe(false);
    expect(makeDayPeriod(startOfJan1).isEqual(period)).toBe(false);
    expect(makeDayPeriod(startOfJan1).isEqual(makeDayPeriod(new Date(2022, 0, 1, 9)))).toBe(true);
    expect(period.isEqual(null)).toBe(false);
  });

  it("compares nullable periods", () => {
    expect(makeDayPeriod.areEqual(null, null)).toBe(true);
    expect(makeDayPeriod.areEqual(null, makeDayPeriod(startOfJan1))).toBe(false);
    expect(makeDayPeriod.areEqual(makeDayPeriod(startOfJan1), null)).toBe(false);
    expect(makeDayPeriod.areEqual(makeDayPeriod(startOfJan1), makeDayPeriod(startOfJan1))).toBe(
      true,
    );
  });

  describe("fromPicker", () => {
    it("creates a period from the range of a DatePicker", () => {
      expect(
        makeDayPeriod.fromPicker([startOfJan1, new Date(2022, 0, 5)])?.toPickerValue(),
      ).toEqual([startOfJan1, endOfJan5]);
      expect(makeDayPeriod.fromPicker([startOfJan1, null])?.end).toBeNull();
      expect(makeDayPeriod.fromPicker(startOfJan1)?.toPickerValue()).toEqual([startOfJan1, null]);
    });

    it("has no period without a start date", () => {
      expect(makeDayPeriod.fromPicker(null)).toBeNull();
      expect(makeDayPeriod.fromPicker(undefined)).toBeNull();
      expect(makeDayPeriod.fromPicker([])).toBeNull();
      expect(makeDayPeriod.fromPicker([null, new Date()])).toBeNull();
    });
  });

  describe("fromIso", () => {
    it("restores the period from its ISO range", () => {
      const period = makeDayPeriod(startOfJan1, endOfJan5);
      expect(makeDayPeriod.fromIso(period.toIsoRange())?.isEqual(period)).toBe(true);
      expect(makeDayPeriod.fromIso({ startDate: startOfJan1.toISOString() })?.end).toBeNull();
    });

    it("has no period without a valid start date", () => {
      expect(makeDayPeriod.fromIso({})).toBeNull();
      expect(makeDayPeriod.fromIso({ endDate: endOfJan5.toISOString() })).toBeNull();
      expect(makeDayPeriod.fromIso({ startDate: "not-a-date" })).toBeNull();
    });

    it("ignores an invalid end date", () => {
      const period = makeDayPeriod.fromIso({
        startDate: startOfJan1.toISOString(),
        endDate: "not-a-date",
      });
      expect(period?.end).toBeNull();
    });
  });
});
