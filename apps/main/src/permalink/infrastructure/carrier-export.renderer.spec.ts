import { describe, expect, it } from "@jest/globals";
import { CarrierErrorCorrectionLevel } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import sharp from "sharp";
import { darkModuleRuns, decodeDataCarrier } from "../../../test/decode-data-carrier";
import { DataCarrier, QUIET_ZONE_MODULES } from "../domain/data-carrier";
import {
  MAX_PNG_EDGE_PX,
  pixelsPerModule,
  renderCarrierPng,
  renderCarrierSvg,
} from "./carrier-export.renderer";

const url = "https://cloud.open-dpp.de/p/3f2c9a54-6b1e-4d7a-9c1f-2a8e5b7d4c10";
const carrier = DataCarrier.encode(url, CarrierErrorCorrectionLevel.M);

describe("renderCarrierSvg", () => {
  it("states its physical size in mm, one viewBox unit per module", () => {
    const svg = renderCarrierSvg(carrier, 0.495);
    const edge = Number((carrier.size * 0.495).toFixed(3));

    expect(svg).toContain(`width="${edge}mm"`);
    expect(svg).toContain(`height="${edge}mm"`);
    expect(svg).toContain(`viewBox="0 0 ${carrier.size} ${carrier.size}"`);
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  it("draws no dark module inside the four-module quiet zone", () => {
    const runs = darkModuleRuns(renderCarrierSvg(carrier, 0.495));
    const lastSymbolIndex = carrier.size - QUIET_ZONE_MODULES - 1;

    expect(runs.length).toBeGreaterThan(0);
    expect(Math.min(...runs.map((run) => run.column))).toBe(QUIET_ZONE_MODULES);
    expect(Math.min(...runs.map((run) => run.row))).toBe(QUIET_ZONE_MODULES);
    expect(Math.max(...runs.map((run) => run.column + run.length - 1))).toBe(lastSymbolIndex);
    expect(Math.max(...runs.map((run) => run.row))).toBe(lastSymbolIndex);
  });

  it("scans back to the encoded content", async () => {
    const svg = renderCarrierSvg(carrier, 0.495);

    await expect(decodeDataCarrier(Buffer.from(svg))).resolves.toBe(url);
  });
});

describe("pixelsPerModule", () => {
  it.each([
    [0.495, 300, 6],
    [0.396, 300, 5],
    [0.495, 203, 4],
    [1.058, 96, 4],
    [0.99, 600, 23],
  ])("maps %s mm at %s DPI to %s whole pixels", (moduleSize, dpi, expected) => {
    expect(pixelsPerModule(moduleSize, dpi)).toBe(expected);
  });

  it("never goes below one pixel", () => {
    expect(pixelsPerModule(0.254, 96)).toBe(1);
  });
});

describe("renderCarrierPng", () => {
  it("draws every module with the same whole number of pixels", async () => {
    const png = await renderCarrierPng(carrier, 0.495, 300);
    const metadata = await sharp(png).metadata();

    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(carrier.size * 6);
    expect(metadata.height).toBe(carrier.size * 6);
  });

  it("records the DPI so the PNG prints at its physical size", async () => {
    const png = await renderCarrierPng(carrier, 0.495, 600);

    expect((await sharp(png).metadata()).density).toBe(600);
  });

  it("keeps the four-module quiet zone light", async () => {
    const scale = pixelsPerModule(0.495, 300);
    const png = await renderCarrierPng(carrier, 0.495, 300);
    const { data, info } = await sharp(png)
      .toColourspace("b-w")
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixelAt = (x: number, y: number) => data[y * info.width + x];
    const quietZonePx = QUIET_ZONE_MODULES * scale;

    for (let y = 0; y < quietZonePx; y++) {
      for (let x = 0; x < info.width; x++) {
        expect(pixelAt(x, y)).toBe(255);
        expect(pixelAt(y, x)).toBe(255);
        expect(pixelAt(x, info.height - 1 - y)).toBe(255);
        expect(pixelAt(info.width - 1 - y, x)).toBe(255);
      }
    }
    // the finder pattern starts right after the quiet zone
    expect(pixelAt(quietZonePx, quietZonePx)).toBe(0);
  });

  it("scans back to the encoded content", async () => {
    const png = await renderCarrierPng(carrier, 0.495, 300);

    await expect(decodeDataCarrier(png)).resolves.toBe(url);
  });

  it("refuses an image larger than the pixel limit", async () => {
    const scale = Math.ceil(MAX_PNG_EDGE_PX / carrier.size) + 1;
    const dpi = 1200;
    const moduleSize = (scale * 25.4) / dpi;

    await expect(renderCarrierPng(carrier, moduleSize, dpi)).rejects.toThrow(ValueError);
  });
});
