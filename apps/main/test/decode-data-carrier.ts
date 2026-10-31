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
