import type { DataTypeDefType } from "@open-dpp/dto";
import { DataTypeDef } from "@open-dpp/dto";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const DATE_FORMAT = "YYYY-MM-DD";
const DATE_TIME_DISPLAY_FORMAT = "YYYY-MM-DD HH:mm:ss";

/**
 * Serialize a Date picked in the user's local timezone for persistence.
 * - `Date`  → "YYYY-MM-DD" (no timezone — a Date is a calendar day, not an instant).
 * - `DateTime` → ISO-8601 with explicit offset (`.toISOString()` emits `…Z`),
 *   so the moment in time is unambiguous regardless of the viewer's timezone.
 */
export function formatDateValueForModel(
  date: Date | null | undefined,
  valueType: DataTypeDefType,
): string | null {
  if (!date)
    return null;
  if (valueType === DataTypeDef.DateTime) {
    return dayjs(date).toISOString();
  }
  return dayjs(date).format(DATE_FORMAT);
}

/**
 * Parse a stored value back into a Date for editor population.
 * Accepts both `YYYY-MM-DD` (Date) and full ISO-8601 (DateTime) forms.
 */
export function parseDateValueFromModel(
  value: string | null | undefined,
): Date | null {
  if (!value)
    return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate() : null;
}

/**
 * IANA timezone name resolved from the runtime environment (e.g. "Europe/Berlin").
 * Wrapped in a helper so components and tests can reuse / stub it.
 */
export function getCurrentTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format a stored value for human display.
 * - `Date`: localized calendar day, no time, no timezone.
 * - `DateTime`: shifted into the viewer's timezone and suffixed with a zone
 *   abbreviation so the reader always knows which zone the displayed time is in.
 *
 * Returns `null` for empty input, and the raw input for values that cannot be
 * parsed as a date (so users still see something instead of "Invalid Date").
 */
export function formatDateValueForDisplay(
  value: string | null | undefined,
  valueType: DataTypeDefType,
  viewerTimezone: string = getCurrentTimezone(),
): string | null {
  if (!value)
    return null;

  if (valueType === DataTypeDef.DateTime) {
    const parsed = dayjs(value);
    if (!parsed.isValid())
      return value;
    const zoned = parsed.tz(viewerTimezone);
    const base = zoned.format(DATE_TIME_DISPLAY_FORMAT);
    // Always suffix with the IANA zone name: deterministic across Node/browsers
    // (where `.format('z')` may return "GMT+2", "CEST", etc.), and unambiguous
    // for the reader.
    return `${base} ${viewerTimezone}`;
  }

  if (valueType === DataTypeDef.Date) {
    const parsed = dayjs(value);
    if (!parsed.isValid())
      return value;
    // Date values don't carry a time-of-day and so the *day* itself doesn't
    // shift with the viewer's timezone. We still append the viewer's zone so
    // the UI is symmetric with DateTime rendering and the reader always knows
    // the ambient zone in which they're looking at the field.
    return `${parsed.format(DATE_FORMAT)} ${viewerTimezone}`;
  }

  return value;
}
