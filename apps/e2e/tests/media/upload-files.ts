import { Buffer } from "node:buffer";
import type { Page } from "@playwright/test";
import { v4 as uuid4 } from "uuid";
import type { UploadFile } from "./media-grid";

export type ImageSize = { width: number; height: number };

/** Has a `viewBox` but no `width`/`height`, the form design tools export by default. */
const VIEWBOX_ONLY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
  <rect width="200" height="100" fill="#6bad87"/>
  <circle cx="100" cy="50" r="30" fill="#ffffff"/>
</svg>`;

function uniqueName(extension: string): string {
  return `e2e-${uuid4().slice(0, 8)}.${extension}`;
}

/** An SVG that has no size of its own, under a name no other test uses. */
export function uniqueSvgFile(): UploadFile {
  return {
    name: uniqueName("svg"),
    mimeType: "image/svg+xml",
    buffer: Buffer.from(VIEWBOX_ONLY_SVG),
  };
}

/** A PNG of exactly this size, drawn in the page, under a name no other test uses. */
export async function uniquePngFile(page: Page, size: ImageSize): Promise<UploadFile> {
  const dataUrl = await page.evaluate(({ width, height }) => {
    const canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext("2d")?.fillRect(0, 0, width, height);
    return canvas.toDataURL("image/png");
  }, size);
  return {
    name: uniqueName("png"),
    mimeType: "image/png",
    buffer: Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64"),
  };
}
