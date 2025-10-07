import type { BreadcrumbTitle } from "../stores/layout.ts";

/**
 * Returns a breadcrumb title object.
 * If `target` is provided, it uses `target` as plain text.
 * Otherwise, it falls back to the localized `fallback` key.
 *
 * @param target - The text to use if available.
 * @param fallback - The localization key to use if `target` is not provided.
 * @returns BreadcrumbTitle object with text and localization flag.
 */
export function textOrLocalizedFallback(
  target: string,
  fallback: string,
): BreadcrumbTitle {
  if (target) {
    return {
      text: target,
      localized: false,
    };
  }

  return {
    text: fallback,
    localized: true,
  };
}

export function localizedBreadcrumb(l: string): BreadcrumbTitle {
  return {
    text: l,
    localized: true,
  };
}
