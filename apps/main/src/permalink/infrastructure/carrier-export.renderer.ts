import { ValueError } from "@open-dpp/exception";
import sharp from "sharp";
import { DataCarrier } from "../domain/data-carrier";

const MM_PER_INCH = 25.4;
const LIGHT = 0xff;
const DARK = 0x00;

/** Largest PNG edge in pixels; bounds the memory one Carrier Export can take. */
export const MAX_PNG_EDGE_PX = 6000;

interface DarkRun {
  start: number;
  length: number;
}

function darkRunsOfRow(carrier: DataCarrier, row: number): DarkRun[] {
  const runs: DarkRun[] = [];
  let start: number | null = null;
  for (let column = 0; column <= carrier.size; column++) {
    const dark = column < carrier.size && carrier.isDark(column, row);
    if (dark && start === null) {
      start = column;
    } else if (!dark && start !== null) {
      runs.push({ start, length: column - start });
      start = null;
    }
  }
  return runs;
}

function formatMm(value: number): string {
  return String(Number(value.toFixed(3)));
}

/**
 * An SVG whose width and height state the physical size in mm. One viewBox unit is one module,
 * so module edges fall on whole units; the quiet zone is part of the light background.
 */
export function renderCarrierSvg(carrier: DataCarrier, moduleSizeMm: number): string {
  const modules = carrier.size;
  const edge = formatMm(modules * moduleSizeMm);
  const path = Array.from({ length: modules }, (_, row) =>
    darkRunsOfRow(carrier, row)
      .map(({ start, length }) => `M${start} ${row}h${length}v1h-${length}z`)
      .join(""),
  ).join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${edge}mm" height="${edge}mm" ` +
    `viewBox="0 0 ${modules} ${modules}" shape-rendering="crispEdges">` +
    `<rect width="${modules}" height="${modules}" fill="#ffffff"/>` +
    `<path fill="#000000" d="${path}"/>` +
    `</svg>`
  );
}

/** Whole pixels per module for a module size at a print resolution; at least one. */
export function pixelsPerModule(moduleSizeMm: number, dpi: number): number {
  return Math.max(1, Math.round((moduleSizeMm * dpi) / MM_PER_INCH));
}

/**
 * A greyscale PNG in which every module is the same whole number of pixels, with the DPI in its
 * `pHYs` chunk so it prints at its physical size.
 */
export async function renderCarrierPng(
  carrier: DataCarrier,
  moduleSizeMm: number,
  dpi: number,
): Promise<Buffer> {
  const scale = pixelsPerModule(moduleSizeMm, dpi);
  const edge = carrier.size * scale;
  if (edge > MAX_PNG_EDGE_PX) {
    throw new ValueError(
      `A PNG of ${edge} px per side exceeds the limit of ${MAX_PNG_EDGE_PX} px; choose a smaller module size or DPI`,
    );
  }
  const pixels = Buffer.alloc(edge * edge, LIGHT);
  for (let row = 0; row < carrier.size; row++) {
    for (const { start, length } of darkRunsOfRow(carrier, row)) {
      for (let y = row * scale; y < (row + 1) * scale; y++) {
        pixels.fill(DARK, y * edge + start * scale, y * edge + (start + length) * scale);
      }
    }
  }
  return await sharp(pixels, { raw: { width: edge, height: edge, channels: 1 } })
    .withDensity(dpi)
    .png()
    .toBuffer();
}
