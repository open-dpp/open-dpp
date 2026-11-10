import { describe, expect, it } from "vitest";
import { CarrierErrorCorrectionLevel, CarrierExportFormat } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import sharp from "sharp";
import {
  darkModuleRuns,
  decodeDataCarrier,
  pngQuietZone,
  svgQuietZone,
} from "../../../test/decode-data-carrier";
import { DataCarrier, MAX_PNG_EDGE_PX, QUIET_ZONE_MODULES, pixelsPerModule } from "./data-carrier";

const url = "https://cloud.open-dpp.de/p/3f2c9a54-6b1e-4d7a-9c1f-2a8e5b7d4c10";
const svgSettings = { format: CarrierExportFormat.SVG, moduleSize: 0.495, dpi: 300 };
const pngSettings = { format: CarrierExportFormat.PNG, moduleSize: 0.495, dpi: 600 };
const FOUR_MODULES_EACH_SIDE = {
  top: QUIET_ZONE_MODULES,
  right: QUIET_ZONE_MODULES,
  bottom: QUIET_ZONE_MODULES,
  left: QUIET_ZONE_MODULES,
};

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

describe("DataCarrier.render as SVG", () => {
  const carrier = DataCarrier.encode(url, CarrierErrorCorrectionLevel.M);

  async function svgOf(): Promise<string> {
    return (await carrier.render(svgSettings)).toString("utf8");
  }

  it("states its physical size in mm, one viewBox unit per module", async () => {
    const svg = await svgOf();
    const edge = Number((carrier.size * svgSettings.moduleSize).toFixed(3));

    expect(svg).toContain(`width="${edge}mm"`);
    expect(svg).toContain(`height="${edge}mm"`);
    expect(svg).toContain(`viewBox="0 0 ${carrier.size} ${carrier.size}"`);
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  it("draws no dark module inside the four-module quiet zone", async () => {
    const svg = await svgOf();

    expect(darkModuleRuns(svg).length).toBeGreaterThan(0);
    expect(svgQuietZone(svg)).toEqual(FOUR_MODULES_EACH_SIDE);
  });

  it("scans back to the encoded content", async () => {
    await expect(decodeDataCarrier(await carrier.render(svgSettings))).resolves.toBe(url);
  });

  it("ignores the DPI", async () => {
    const atOtherDpi = await carrier.render({ ...svgSettings, dpi: 600 });

    expect(atOtherDpi).toEqual(await carrier.render(svgSettings));
  });
});

describe("pixelsPerModule", () => {
  it.each([
    [0.495, 300, 6],
    [0.396, 300, 5],
    [0.495, 203, 4],
    [1.058, 96, 4],
    [0.99, 600, 24],
    [0.254, 203, 3],
    [0.254, 300, 3],
    [0.508, 300, 6],
  ])("maps %s mm at %s DPI to %s whole pixels", (moduleSize, dpi, expected) => {
    expect(pixelsPerModule(moduleSize, dpi)).toBe(expected);
  });

  it.each([
    [0.254, 203],
    [0.99, 600],
    [0.27, 300],
  ])("never prints a %s mm module smaller at %s DPI", (moduleSize, dpi) => {
    expect((pixelsPerModule(moduleSize, dpi) * 25.4) / dpi).toBeGreaterThanOrEqual(moduleSize);
  });

  it("never goes below one pixel", () => {
    expect(pixelsPerModule(0.254, 96)).toBe(1);
  });
});

describe("DataCarrier.render as PNG", () => {
  const carrier = DataCarrier.encode(url, CarrierErrorCorrectionLevel.M);
  const at300Dpi = { ...pngSettings, dpi: 300 };

  it("draws every module with the same whole number of pixels", async () => {
    const metadata = await sharp(await carrier.render(at300Dpi)).metadata();

    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(carrier.size * 6);
    expect(metadata.height).toBe(carrier.size * 6);
  });

  it("records the DPI so the PNG prints at its physical size", async () => {
    const png = await carrier.render(pngSettings);

    expect((await sharp(png).metadata()).density).toBe(pngSettings.dpi);
  });

  it("keeps the four-module quiet zone light", async () => {
    const png = await carrier.render(at300Dpi);

    await expect(
      pngQuietZone(png, pixelsPerModule(at300Dpi.moduleSize, at300Dpi.dpi)),
    ).resolves.toEqual(FOUR_MODULES_EACH_SIDE);
  });

  it("scans back to the encoded content", async () => {
    await expect(decodeDataCarrier(await carrier.render(at300Dpi))).resolves.toBe(url);
  });

  it("refuses an image larger than the pixel limit", async () => {
    const scale = Math.ceil(MAX_PNG_EDGE_PX / carrier.size) + 1;
    const dpi = 1200;
    const moduleSize = (scale * 25.4) / dpi;

    await expect(carrier.render({ ...pngSettings, moduleSize, dpi })).rejects.toThrow(ValueError);
  });
});

describe("DataCarrier.export", () => {
  const carrier = DataCarrier.encode(url, CarrierErrorCorrectionLevel.M);

  it.each([
    [svgSettings, "image/svg+xml", "data-carrier-lot-42.svg"],
    [pngSettings, "image/png", "data-carrier-lot-42.png"],
  ])("exports %o as a named file", async (settings, contentType, fileName) => {
    const carrierExport = await carrier.export(settings, "lot-42");

    expect(carrierExport).toEqual({
      content: await carrier.render(settings),
      contentType,
      fileName,
    });
  });
});
