import { describe, expect, it } from "@jest/globals";
import { CarrierErrorCorrectionLevel } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { DataCarrier, QUIET_ZONE_MODULES } from "./data-carrier";

const url = "https://cloud.open-dpp.de/p/3f2c9a54-6b1e-4d7a-9c1f-2a8e5b7d4c10";

function rowOf(carrier: DataCarrier, row: number): boolean[] {
  return Array.from({ length: carrier.size }, (_, column) => carrier.isDark(column, row));
}

describe("DataCarrier", () => {
  it("adds four modules of quiet zone on every side of the symbol", () => {
    // "HELLO" fits a version 1 symbol: 21 modules per side
    const carrier = DataCarrier.encode("HELLO", CarrierErrorCorrectionLevel.M);

    expect(QUIET_ZONE_MODULES).toBe(4);
    expect(carrier.size).toBe(21 + 2 * QUIET_ZONE_MODULES);
    for (let i = 0; i < QUIET_ZONE_MODULES; i++) {
      const lastIndex = carrier.size - 1 - i;
      expect(rowOf(carrier, i).some(Boolean)).toBe(false);
      expect(rowOf(carrier, lastIndex).some(Boolean)).toBe(false);
      for (let row = 0; row < carrier.size; row++) {
        expect(carrier.isDark(i, row)).toBe(false);
        expect(carrier.isDark(lastIndex, row)).toBe(false);
      }
    }
  });

  it("starts the symbol with the finder pattern right after the quiet zone", () => {
    const carrier = DataCarrier.encode(url, CarrierErrorCorrectionLevel.M);

    // a finder pattern's outer ring is seven dark modules
    const firstSymbolRow = rowOf(carrier, QUIET_ZONE_MODULES);
    expect(firstSymbolRow.slice(QUIET_ZONE_MODULES, QUIET_ZONE_MODULES + 7)).toEqual(
      Array(7).fill(true),
    );
  });

  it("keeps the content and error-correction level it was encoded with", () => {
    const carrier = DataCarrier.encode(url, CarrierErrorCorrectionLevel.Q);

    expect(carrier.content).toBe(url);
    expect(carrier.errorCorrection).toBe(CarrierErrorCorrectionLevel.Q);
  });

  it("grows with the error-correction level", () => {
    const low = DataCarrier.encode(url, CarrierErrorCorrectionLevel.L);
    const high = DataCarrier.encode(url, CarrierErrorCorrectionLevel.H);

    expect(high.size).toBeGreaterThan(low.size);
  });

  it("treats coordinates outside the grid as light", () => {
    const carrier = DataCarrier.encode(url, CarrierErrorCorrectionLevel.M);

    expect(carrier.isDark(-1, 0)).toBe(false);
    expect(carrier.isDark(0, carrier.size)).toBe(false);
  });

  it("refuses empty content", () => {
    expect(() => DataCarrier.encode("", CarrierErrorCorrectionLevel.M)).toThrow(ValueError);
  });

  it("refuses content that does not fit a QR Code at the chosen level", () => {
    const tooLong = `https://example.com/${"x".repeat(3000)}`;

    expect(() => DataCarrier.encode(tooLong, CarrierErrorCorrectionLevel.H)).toThrow(ValueError);
  });
});
