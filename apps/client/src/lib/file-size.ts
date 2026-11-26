/** A unit is this many times the one before it: 1 KB = 1024 B. */
const UNIT_FACTOR = 1024;
const BYTE_UNIT = "B";
/** The units above the byte, smallest first. */
const LARGER_UNITS = ["KB", "MB", "GB"] as const;
const MAX_DECIMALS = 1;
const ROUNDING_FACTOR = 10 ** MAX_DECIMALS;

interface FileSize {
  value: number;
  unit: string;
}

function roundToMaxDecimals(value: number): number {
  return Math.round(value * ROUNDING_FACTOR) / ROUNDING_FACTOR;
}

/**
 * The size of a file in the unit that fits it: "209 B", "33.2 KB", "1.5 MB".
 *
 * A unit is 1024 times the one before it, as the upload limit counts. The unit is chosen
 * from the rounded value, so a size just below a unit reads "1 MB" and not "1024 KB".
 */
export function formatFileSize(bytes: number, locale: string): string {
  // Walk up the units until the rounded value stays below the next unit
  const size = LARGER_UNITS.reduce<FileSize>(
    (candidate, unit, index) =>
      candidate.value < UNIT_FACTOR
        ? candidate
        : { unit, value: roundToMaxDecimals(bytes / UNIT_FACTOR ** (index + 1)) },
    { unit: BYTE_UNIT, value: bytes },
  );
  const value = new Intl.NumberFormat(locale, {
    maximumFractionDigits: MAX_DECIMALS,
    useGrouping: false,
  }).format(size.value);
  return `${value} ${size.unit}`;
}
