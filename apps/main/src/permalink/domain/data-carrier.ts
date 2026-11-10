import {
  CARRIER_EXPORT_CONTENT_TYPES,
  CarrierExportFormat,
  type CarrierErrorCorrectionLevelType,
  type CarrierExportQuery,
} from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { create } from "qrcode";
import { renderCarrierPng, renderCarrierSvg } from "./carrier-export.renderer";

/** Light modules a QR Code needs on every side (ISO/IEC 18004, restated by EN 18220). */
export const QUIET_ZONE_MODULES = 4;

/** How a Carrier Export draws its Data Carrier; the error correction belongs to the symbol. */
export type CarrierExportSettings = Pick<CarrierExportQuery, "format" | "moduleSize" | "dpi">;

/** A downloadable file of one Data Carrier, ready to print or embed. */
export interface CarrierExport {
  content: Buffer;
  contentType: string;
  fileName: string;
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
      return await renderCarrierPng(this, settings.moduleSize, settings.dpi);
    }
    return Buffer.from(renderCarrierSvg(this, settings.moduleSize), "utf8");
  }

  /** The Carrier Export of this symbol, saved as `data-carrier-<name>.<format>`. */
  async export(settings: CarrierExportSettings, name: string): Promise<CarrierExport> {
    return {
      content: await this.render(settings),
      contentType: CARRIER_EXPORT_CONTENT_TYPES[settings.format],
      fileName: `data-carrier-${name}.${settings.format}`,
    };
  }
}
