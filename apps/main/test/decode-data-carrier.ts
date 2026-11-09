import jsQR from "jsqr";
import sharp from "sharp";

/** Rasterizes an SVG or PNG Carrier Export and returns the content a scanner reads from it. */
export async function decodeDataCarrier(
  image: Buffer,
  options: { svgDensity?: number } = {},
): Promise<string | null> {
  const { data, info } = await sharp(image, { density: options.svgDensity ?? 300 })
    .flatten({ background: "#ffffff" })
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
  return jsQR(pixels, info.width, info.height)?.data ?? null;
}

/** Dark-module runs of a Carrier Export SVG path, as written by `renderCarrierSvg`. */
export function darkModuleRuns(svg: string): { column: number; row: number; length: number }[] {
  const path = /<path[^>]* d="([^"]*)"/.exec(svg)?.[1] ?? "";
  return [...path.matchAll(/M(\d+) (\d+)h(\d+)/g)].map(([, column, row, length]) => ({
    column: Number(column),
    row: Number(row),
    length: Number(length),
  }));
}

/** Light modules between the symbol and each edge of a Carrier Export. */
export interface QuietZone {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** The quiet zone of a Carrier Export SVG, read from its dark-module runs and its viewBox. */
export function svgQuietZone(svg: string): QuietZone {
  const modules = Number(/viewBox="0 0 (\d+) \1"/.exec(svg)?.[1]);
  const runs = darkModuleRuns(svg);
  return {
    top: Math.min(...runs.map((run) => run.row)),
    right: modules - Math.max(...runs.map((run) => run.column + run.length)),
    bottom: modules - 1 - Math.max(...runs.map((run) => run.row)),
    left: Math.min(...runs.map((run) => run.column)),
  };
}

/** The quiet zone of a Carrier Export PNG, from the bounding box of its dark pixels. */
export async function pngQuietZone(png: Buffer, pixelsPerModule: number): Promise<QuietZone> {
  const { data, info } = await sharp(png)
    .toColourspace("b-w")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const isDark = (x: number, y: number) => data[(y * info.width + x) * info.channels] < 128;
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (isDark(x, y)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return {
    top: minY / pixelsPerModule,
    right: (info.width - 1 - maxX) / pixelsPerModule,
    bottom: (info.height - 1 - maxY) / pixelsPerModule,
    left: minX / pixelsPerModule,
  };
}
