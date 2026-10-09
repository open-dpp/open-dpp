import dayjs from "dayjs";

/**
 * A period of whole days: from the start of the first to the end of the last day in the
 * timezone of the user, so both days are included. The end is open when it is `null`.
 */
export interface DayPeriod {
  /** Start of the first day. */
  readonly start: Date;
  /** End of the last day, `null` for an open-ended period. */
  readonly end: Date | null;
  /** Whether `other` spans the same calendar days, regardless of times of day. */
  isEqual: (other: DayPeriod | null) => boolean;
  /** The value of a range DatePicker. */
  toPickerValue: () => [Date, Date | null];
  /** The ISO instants the API expects as `startDate` / `endDate`. */
  toIsoRange: () => { startDate: string; endDate?: string };
}

type PickerValue = Date | ReadonlyArray<Date | null> | null | undefined;

export function makeDayPeriod(start: Date, end: Date | null = null): DayPeriod {
  const firstDay = dayjs(start).startOf("day");
  const lastDay = end ? dayjs(end).endOf("day") : null;

  function isEqual(other: DayPeriod | null): boolean {
    if (!other) {
      return false;
    }
    const sameEnd = lastDay ? lastDay.isSame(other.end, "day") : other.end === null;
    return firstDay.isSame(other.start, "day") && sameEnd;
  }

  function toPickerValue(): [Date, Date | null] {
    return [firstDay.toDate(), lastDay?.toDate() ?? null];
  }

  function toIsoRange() {
    return {
      startDate: firstDay.toISOString(),
      ...(lastDay && { endDate: lastDay.toISOString() }),
    };
  }

  return {
    start: firstDay.toDate(),
    end: lastDay?.toDate() ?? null,
    isEqual,
    toPickerValue,
    toIsoRange,
  };
}

/** From the value of a range DatePicker; nothing is picked without a start date. */
makeDayPeriod.fromPicker = (value: PickerValue): DayPeriod | null => {
  if (value instanceof Date) {
    return makeDayPeriod(value);
  }
  const [start, end] = value ?? [];
  return start ? makeDayPeriod(start, end ?? null) : null;
};

/** From ISO strings, e.g. of the URL query; nothing is picked without a valid start date. */
makeDayPeriod.fromIso = (range: { startDate?: string; endDate?: string }): DayPeriod | null => {
  const start = range.startDate ? dayjs(range.startDate) : null;
  if (!start?.isValid()) {
    return null;
  }
  const end = range.endDate ? dayjs(range.endDate) : null;
  return makeDayPeriod(start.toDate(), end?.isValid() ? end.toDate() : null);
};

makeDayPeriod.areEqual = (a: DayPeriod | null, b: DayPeriod | null): boolean =>
  a === null ? b === null : a.isEqual(b);
