// Maps a legacy /presentation/<upiUuid>[/...] path captured by Vue Router to the
// existing backend /api/unique-product-identifiers[/<upiUuid>[/...]] endpoint,
// which 301-redirects to /p/<permalinkId>[/...] after resolving the UPI to a
// permalink. See apps/main/src/unique-product-identifier/presentation/
// unique.product.identifier.controller.ts.
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
