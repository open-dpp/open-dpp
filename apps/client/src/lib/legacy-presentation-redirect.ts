export function buildLegacyPresentationApiUrl(
  legacyPath: string | readonly string[] | null | undefined,
  searchString: string,
): string {
  const segments = Array.isArray(legacyPath)
    ? legacyPath
    : legacyPath
      ? [legacyPath as string]
      : [];
  const suffix = segments
    .filter((s) => s.length > 0)
    .map((s) => encodeURIComponent(s))
    .join("/");
  const base = suffix
    ? `/api/unique-product-identifiers/${suffix}`
    : "/api/unique-product-identifiers";
  return base + searchString;
}
