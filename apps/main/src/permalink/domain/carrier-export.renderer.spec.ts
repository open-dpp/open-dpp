import { describe, expect, it } from "vitest";
import { CarrierErrorCorrectionLevel } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import sharp from "sharp";
import {
  darkModuleRuns,
  decodeDataCarrier,
  pngQuietZone,
  svgQuietZone,
} from "../../../test/decode-data-carrier";
import { DataCarrier, QUIET_ZONE_MODULES } from "./data-carrier";
import {
  MAX_PNG_EDGE_PX,
  pixelsPerModule,
  renderCarrierPng,
  renderCarrierSvg,
} from "./carrier-export.renderer";

const url = "https://cloud.open-dpp.de/p/3f2c9a54-6b1e-4d7a-9c1f-2a8e5b7d4c10";
const carrier = DataCarrier.encode(url, CarrierErrorCorrectionLevel.M);
const FOUR_MODULES_EACH_SIDE = {
  top: QUIET_ZONE_MODULES,
  right: QUIET_ZONE_MODULES,
  bottom: QUIET_ZONE_MODULES,
  left: QUIET_ZONE_MODULES,
};

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
    const svg = renderCarrierSvg(carrier, 0.495);

    expect(darkModuleRuns(svg).length).toBeGreaterThan(0);
    expect(svgQuietZone(svg)).toEqual(FOUR_MODULES_EACH_SIDE);
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
    const png = await renderCarrierPng(carrier, 0.495, 300);

    await expect(pngQuietZone(png, pixelsPerModule(0.495, 300))).resolves.toEqual(
      FOUR_MODULES_EACH_SIDE,
    );
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
