function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let normalized = hex.trim().replace(/^#/, "");

  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map(c => c + c)
      .join("");
  }

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const num = Number.parseInt(normalized, 16);

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  return `#${rgb.r.toString(16).padStart(2, "0")}${rgb.g.toString(16).padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`;
}

const paletteLevels = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

type PaletteLevel = (typeof paletteLevels)[number];
type ColorPalette = Record<PaletteLevel, string>;

function getPaletteLevelAt(index: number): PaletteLevel {
  const level = paletteLevels[index];
  if (level === undefined) {
    throw new Error(`Invalid palette index: ${index}`);
  }
  return level;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lightenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  const factor = clamp01(amount);

  return rgbToHex({
    r: Math.round(rgb.r + (255 - rgb.r) * factor),
    g: Math.round(rgb.g + (255 - rgb.g) * factor),
    b: Math.round(rgb.b + (255 - rgb.b) * factor),
  });
}

function darkenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  const factor = clamp01(amount);

  return rgbToHex({
    r: Math.round(rgb.r * (1 - factor)),
    g: Math.round(rgb.g * (1 - factor)),
    b: Math.round(rgb.b * (1 - factor)),
  });
}

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045
    ? c / 12.92
    : ((c + 0.055) / 1.055) ** 2.4;
}

function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const luminance1 = getLuminance(hexToRgb(hex1));
  const luminance2 = getLuminance(hexToRgb(hex2));

  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

function getPalettePositionByContrast(hex: string): PaletteLevel {
  const normalizedHex = rgbToHex(hexToRgb(hex));
  const contrastWithWhite = getContrastRatio(normalizedHex, "#ffffff");
  const contrastWithBlack = getContrastRatio(normalizedHex, "#000000");

  // Higher ratio against white means a darker base color.
  const darkness = contrastWithWhite / (contrastWithWhite + contrastWithBlack);
  const index = Math.min(
    paletteLevels.length - 1,
    Math.max(0, Math.round(darkness * (paletteLevels.length - 1))),
  );

  return getPaletteLevelAt(index);
}

function createColorPalette(hex: string): ColorPalette {
  const normalizedHex = rgbToHex(hexToRgb(hex));
  const baseLevel = getPalettePositionByContrast(normalizedHex);
  const baseIndex = paletteLevels.indexOf(baseLevel);
  const stepAmount = 0.12;

  const palette = {} as ColorPalette;

  for (const [index, level] of paletteLevels.entries()) {
    if (index === baseIndex) {
      palette[level] = normalizedHex;
      continue;
    }

    const distance = Math.abs(index - baseIndex);
    const amount = distance * stepAmount;

    palette[level] = index < baseIndex
      ? lightenHex(normalizedHex, amount)
      : darkenHex(normalizedHex, amount);
  }

  return palette;
}

export {
  createColorPalette,
  darkenHex,
  getContrastRatio,
  getPalettePositionByContrast,
  lightenHex,
};
