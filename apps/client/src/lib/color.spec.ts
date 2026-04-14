import { describe, expect, it } from "vitest";
import {
  createColorPalette,
  darkenHex,
  getContrastRatio,
  getPalettePositionByContrast,
  lightenHex,
} from "./color";

describe("getContrastRatio", () => {
  it("returns 21 for black and white", () => {
    expect(getContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 10);
  });

  it("returns 1 for identical colors", () => {
    expect(getContrastRatio("#336699", "#336699")).toBeCloseTo(1, 10);
  });

  it("is symmetric regardless of argument order", () => {
    const forward = getContrastRatio("#123456", "#fedcba");
    const reverse = getContrastRatio("#fedcba", "#123456");
    expect(forward).toBeCloseTo(reverse, 12);
  });

  it("supports 3-digit shorthand hex values", () => {
    expect(getContrastRatio("#000", "#fff")).toBeCloseTo(21, 10);
  });

  it("throws for invalid hex input", () => {
    expect(() => getContrastRatio("#zzzzzz", "#ffffff")).toThrow("Invalid hex color");
  });
});

describe("lightenHex", () => {
  it("lightens black by 10%", () => {
    expect(lightenHex("#000000", 0.1)).toBe("#1a1a1a");
  });

  it("supports 3-digit hex input", () => {
    expect(lightenHex("#abc", 0)).toBe("#aabbcc");
  });

  it("clamps amounts above 1", () => {
    expect(lightenHex("#123456", 2)).toBe("#ffffff");
  });

  it("throws for invalid hex input", () => {
    expect(() => lightenHex("#xyz", 0.2)).toThrow("Invalid hex color");
  });
});

describe("darkenHex", () => {
  it("darkens white by 10%", () => {
    expect(darkenHex("#ffffff", 0.1)).toBe("#e6e6e6");
  });

  it("supports 3-digit hex input", () => {
    expect(darkenHex("#abc", 0)).toBe("#aabbcc");
  });

  it("clamps amounts above 1", () => {
    expect(darkenHex("#123456", 2)).toBe("#000000");
  });

  it("throws for invalid hex input", () => {
    expect(() => darkenHex("#xyz", 0.2)).toThrow("Invalid hex color");
  });
});

describe("getPalettePositionByContrast", () => {
  it("maps white to 100", () => {
    expect(getPalettePositionByContrast("#ffffff")).toBe(100);
  });

  it("maps black to 900", () => {
    expect(getPalettePositionByContrast("#000000")).toBe(900);
  });

  it("maps a medium gray close to the middle", () => {
    expect(getPalettePositionByContrast("#777777")).toBe(500);
  });
});

describe("createColorPalette", () => {
  it("creates all palette keys from 100 to 900", () => {
    const palette = createColorPalette("#336699");

    expect(Object.keys(palette).map(Number)).toEqual([
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900,
    ]);
  });

  it("places the original color at the contrast-determined palette position", () => {
    const baseHex = "#777777";
    const position = getPalettePositionByContrast(baseHex);
    const palette = createColorPalette(baseHex);

    expect(palette[position]).toBe(baseHex);
  });

  it("produces increasingly darker shades from 100 to 900", () => {
    const palette = createColorPalette("#5f8fc0");
    const levels = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

    for (let i = 0; i < levels.length - 1; i++) {
      const currentLevel = levels[i];
      const nextLevel = levels[i + 1];

      if (currentLevel === undefined || nextLevel === undefined) {
        throw new Error("Invalid test level index");
      }

      const current = getContrastRatio(palette[currentLevel], "#ffffff");
      const next = getContrastRatio(palette[nextLevel], "#ffffff");
      expect(next).toBeGreaterThanOrEqual(current);
    }
  });

  it("throws for invalid hex input", () => {
    expect(() => createColorPalette("#xyz")).toThrow("Invalid hex color");
  });
});
