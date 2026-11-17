import {
  CARRIER_EXPORT_CONTENT_TYPES,
  CarrierExportFormat,
  type CarrierErrorCorrectionLevelType,
  type CarrierExportQuery,
} from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { create } from "qrcode";
import sharp from "sharp";

/** Light modules a QR Code needs on every side (ISO/IEC 18004, restated by EN 18220). */
export const QUIET_ZONE_MODULES = 4;

/** Largest PNG edge in pixels; bounds the memory one Carrier Export can take. */
export const MAX_PNG_EDGE_PX = 6000;

const MM_PER_INCH = 25.4;
const LIGHT = 0xff;
const DARK = 0x00;

/** Absorbs floating-point noise so an exact pixel count (0.254 mm at 300 DPI) is not rounded up. */
const PIXEL_TOLERANCE = 1e-9;

/** How a Carrier Export draws its Data Carrier; the error correction belongs to the symbol. */
export type CarrierExportSettings = Pick<CarrierExportQuery, "format" | "moduleSize" | "dpi">;

/** A downloadable file of one Data Carrier, ready to print or embed. */
export interface CarrierExport {
  content: Buffer;
  contentType: string;
  fileName: string;
}

interface DarkRun {
  start: number;
  length: number;
}

/**
 * Whole pixels per module for a module size at a print resolution, rounded up so a module never
 * prints smaller than its module size (the X-dimension is a minimum); at least one.
 */
export function pixelsPerModule(moduleSizeMm: number, dpi: number): number {
  return Math.max(1, Math.ceil((moduleSizeMm * dpi) / MM_PER_INCH - PIXEL_TOLERANCE));
}

function formatMm(value: number): string {
  return String(Number(value.toFixed(3)));
}

/**
 * The QR Code symbol that encodes one Permalink's public URL, as a square grid of modules that
 * includes the quiet zone. It knows no units itself; `render` draws it at a physical size.
 */
export class DataCarrier {
  private constructor(
    public readonly content: string,
    public readonly errorCorrection: CarrierErrorCorrectionLevelType,
    private readonly symbolSize: number,
    private readonly modules: Uint8Array,
  ) {}

  static encode(content: string, errorCorrection: CarrierErrorCorrectionLevelType): DataCarrier {
    if (content.length === 0) {
      throw new ValueError("A Data Carrier needs content to encode");
    }
    try {
      const { modules } = create(content, { errorCorrectionLevel: errorCorrection });
      return new DataCarrier(content, errorCorrection, modules.size, Uint8Array.from(modules.data));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new ValueError(
        `Cannot encode ${content.length} characters at error correction ${errorCorrection}: ${reason}`,
      );
    }
  }

  /** Modules per side, quiet zone included. */
  get size(): number {
    return this.symbolSize + 2 * QUIET_ZONE_MODULES;
  }

  /** Whether the module at (column, row) is dark; coordinates count the quiet zone. */
  isDark(column: number, row: number): boolean {
    const x = column - QUIET_ZONE_MODULES;
    const y = row - QUIET_ZONE_MODULES;
    if (x < 0 || y < 0 || x >= this.symbolSize || y >= this.symbolSize) {
      return false;
    }
    return this.modules[y * this.symbolSize + x] === 1;
  }

  /** The image bytes in the chosen format; the DPI is used only for PNG. */
  async render(settings: CarrierExportSettings): Promise<Buffer> {
    if (settings.format === CarrierExportFormat.PNG) {
      return await this.renderPng(settings.moduleSize, settings.dpi);
    }
    return Buffer.from(this.renderSvg(settings.moduleSize), "utf8");
  }

  /** The Carrier Export of this symbol, saved as `data-carrier-<name>.<format>`. */
  async export(settings: CarrierExportSettings, name: string): Promise<CarrierExport> {
    return {
      content: await this.render(settings),
      contentType: CARRIER_EXPORT_CONTENT_TYPES[settings.format],
      fileName: `data-carrier-${name}.${settings.format}`,
    };
  }

  /**
   * An SVG whose width and height state the physical size in mm. One viewBox unit is one module,
   * so module edges fall on whole units; the quiet zone is part of the light background.
   */
  private renderSvg(moduleSizeMm: number): string {
    const modules = this.size;
    const edge = formatMm(modules * moduleSizeMm);
    const path = Array.from({ length: modules }, (_, row) =>
      this.darkRunsOfRow(row)
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

  /**
   * A greyscale PNG in which every module is the same whole number of pixels, with the DPI in its
   * `pHYs` chunk so it prints at its physical size.
   */
  private async renderPng(moduleSizeMm: number, dpi: number): Promise<Buffer> {
    const scale = pixelsPerModule(moduleSizeMm, dpi);
    const edge = this.size * scale;
    if (edge > MAX_PNG_EDGE_PX) {
      throw new ValueError(
        `A PNG of ${edge} px per side exceeds the limit of ${MAX_PNG_EDGE_PX} px; choose a smaller module size or DPI`,
      );
    }
    const pixels = Buffer.alloc(edge * edge, LIGHT);
    for (let row = 0; row < this.size; row++) {
      for (const { start, length } of this.darkRunsOfRow(row)) {
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

  private darkRunsOfRow(row: number): DarkRun[] {
    const runs: DarkRun[] = [];
    let start: number | null = null;
    for (let column = 0; column <= this.size; column++) {
      const dark = column < this.size && this.isDark(column, row);
      if (dark && start === null) {
        start = column;
      } else if (!dark && start !== null) {
        runs.push({ start, length: column - start });
        start = null;
      }
    }
    return runs;
  }
}
