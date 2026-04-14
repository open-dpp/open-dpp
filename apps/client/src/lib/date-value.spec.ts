import { DataTypeDef } from "@open-dpp/dto";
import { describe, expect, it } from "vitest";
import {
  formatDateValueForDisplay,
  formatDateValueForModel,
  getCurrentTimezone,
  parseDateValueFromModel,
} from "./date-value.ts";

describe("date-value helpers", () => {
  describe("formatDateValueForModel", () => {
    it("returns null when the date is null", () => {
      expect(formatDateValueForModel(null, DataTypeDef.DateTime)).toBeNull();
      expect(formatDateValueForModel(null, DataTypeDef.Date)).toBeNull();
    });

    it("serializes Date values as YYYY-MM-DD without timezone info", () => {
      const d = new Date("2026-04-10T14:00:00+02:00");
      expect(formatDateValueForModel(d, DataTypeDef.Date)).toBe("2026-04-10");
    });

    it("serializes DateTime values as ISO-8601 with an explicit offset", () => {
      const d = new Date("2026-04-10T14:00:00+02:00");
      const serialized = formatDateValueForModel(d, DataTypeDef.DateTime);
      expect(serialized).not.toBeNull();
      // ISO-8601 with explicit offset (Z or +HH:MM / +HHMM)
      expect(serialized).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/,
      );
    });

    it("round-trips a DateTime value to the same instant regardless of viewer TZ", () => {
      const original = new Date("2026-04-10T14:00:00+02:00");
      const serialized = formatDateValueForModel(
        original,
        DataTypeDef.DateTime,
      );
      const parsed = parseDateValueFromModel(serialized);
      expect(parsed).not.toBeNull();
      expect(parsed!.getTime()).toBe(original.getTime());
    });
  });

  describe("parseDateValueFromModel", () => {
    it("returns null for null / undefined / empty", () => {
      expect(parseDateValueFromModel(null)).toBeNull();
      expect(parseDateValueFromModel(undefined)).toBeNull();
      expect(parseDateValueFromModel("")).toBeNull();
    });

    it("returns null for invalid input", () => {
      expect(parseDateValueFromModel("not-a-date")).toBeNull();
    });

    it("parses an ISO-8601 string with offset into a Date at the correct instant", () => {
      const parsed = parseDateValueFromModel("2026-04-10T14:00:00Z");
      expect(parsed).not.toBeNull();
      expect(parsed!.toISOString()).toBe("2026-04-10T14:00:00.000Z");
    });
  });

  describe("getCurrentTimezone", () => {
    it("returns a non-empty timezone name with no whitespace", () => {
      const zone = getCurrentTimezone();
      expect(typeof zone).toBe("string");
      expect(zone.length).toBeGreaterThan(0);
      expect(zone.trim()).toBe(zone);
      expect(zone).not.toContain(" ");
    });
  });

  describe("formatDateValueForDisplay", () => {
    it("returns null for null / empty", () => {
      expect(
        formatDateValueForDisplay(null, DataTypeDef.DateTime, "Europe/Berlin"),
      ).toBeNull();
      expect(
        formatDateValueForDisplay("", DataTypeDef.Date, "Europe/Berlin"),
      ).toBeNull();
    });

    it("formats Date values as a localized date with a zone suffix", () => {
      const out = formatDateValueForDisplay(
        "2026-04-10",
        DataTypeDef.Date,
        "Europe/Berlin",
      );
      expect(out).toBe("2026-04-10 Europe/Berlin");
    });

    it("shows the zone label on Date values even though the day itself does not shift", () => {
      const berlin = formatDateValueForDisplay(
        "2026-04-10",
        DataTypeDef.Date,
        "Europe/Berlin",
      );
      const tokyo = formatDateValueForDisplay(
        "2026-04-10",
        DataTypeDef.Date,
        "Asia/Tokyo",
      );
      expect(berlin).toBe("2026-04-10 Europe/Berlin");
      expect(tokyo).toBe("2026-04-10 Asia/Tokyo");
    });

    it("formats DateTime values in the viewer's timezone and includes a zone label", () => {
      const out = formatDateValueForDisplay(
        "2026-04-10T14:00:00Z", // 14:00 UTC
        DataTypeDef.DateTime,
        "Europe/Berlin", // +02:00 in April (CEST)
      );
      expect(out).not.toBeNull();
      // 14:00 UTC → 16:00 Berlin
      expect(out!).toContain("16:00");
      // zone must be explicit somewhere in the string
      expect(
        out!.includes("Europe/Berlin") || out!.includes("CEST"),
      ).toBe(true);
    });

    it("shifts DateTime rendering when viewer timezone changes", () => {
      const berlin = formatDateValueForDisplay(
        "2026-04-10T14:00:00Z",
        DataTypeDef.DateTime,
        "Europe/Berlin",
      );
      const tokyo = formatDateValueForDisplay(
        "2026-04-10T14:00:00Z",
        DataTypeDef.DateTime,
        "Asia/Tokyo",
      );
      // 14:00 UTC → 16:00 Berlin, 23:00 Tokyo
      expect(berlin).toContain("16:00");
      expect(tokyo).toContain("23:00");
      expect(berlin).not.toBe(tokyo);
    });

    it("returns the raw string when the value is not a valid date", () => {
      const out = formatDateValueForDisplay(
        "not-a-date",
        DataTypeDef.DateTime,
        "Europe/Berlin",
      );
      expect(out).toBe("not-a-date");
    });
  });
});
