import type { PermalinkFallbackBaseUrlSource, PermalinkPublicDto } from "@open-dpp/dto";
import {
  buildGs1DataAttributeQuery,
  canonicaliseBaseUrl,
  PERMALINK_RESERVED_SLUGS,
  PermalinkBaseUrlSchema,
  PermalinkSlugSchema,
} from "@open-dpp/dto";
import { computed, type ComputedRef, type Ref } from "vue";

export type PermalinkPreviewSource = "permalink" | PermalinkFallbackBaseUrlSource;

export interface PermalinkPreview {
  effectiveBase: ComputedRef<string>;
  effectiveSlug: ComputedRef<string>;
  previewUrl: ComputedRef<string>;
  previewSource: ComputedRef<PermalinkPreviewSource>;
  previewValid: ComputedRef<boolean>;
  locked: ComputedRef<boolean>;
}

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

const reservedSlugs = new Set<string>(PERMALINK_RESERVED_SLUGS);

function isSlugValid(value: string): boolean {
  if (reservedSlugs.has(value)) return false;
  return PermalinkSlugSchema.safeParse(value).success;
}

function isBaseUrlValid(value: string): boolean {
  return PermalinkBaseUrlSchema.safeParse(value).success;
}

/** Strips the last path segment from a URL and returns the canonicalised base. */
function deriveBaseFromUrl(fullUrl: string): string {
  try {
    const url = new URL(fullUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    segments.pop();
    const path = segments.length ? `/${segments.join("/")}` : "";
    return canonicaliseBaseUrl(`${url.protocol}//${url.host}${path}`);
  } catch {
    return "";
  }
}

/** Returns the last path segment of a URL (the slug part). */
function deriveSlugFromUrl(fullUrl: string): string {
  try {
    const url = new URL(fullUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.at(-1) ?? "";
  } catch {
    return "";
  }
}

function deriveFallbackBaseUrl(permalink: PermalinkPublicDto): string {
  if (permalink.fallbackBaseUrl) return permalink.fallbackBaseUrl;
  return deriveBaseFromUrl(permalink.publicUrl);
}

export function usePermalinkPreview(
  permalink: Ref<PermalinkPublicDto | undefined>,
  slugInput: Ref<string>,
  baseUrlInput: Ref<string>,
): PermalinkPreview {
  const trimmedBase = computed(() => trimToNull(baseUrlInput.value));
  const trimmedSlug = computed(() => trimToNull(slugInput.value));

  const locked = computed(() => Boolean(permalink.value?.publishedUrl));

  const effectiveBase = computed(() => {
    if (locked.value && permalink.value?.publishedUrl) {
      return deriveBaseFromUrl(permalink.value.publishedUrl);
    }
    if (trimmedBase.value !== null) {
      return canonicaliseBaseUrl(trimmedBase.value);
    }
    if (!permalink.value) return "";
    return deriveFallbackBaseUrl(permalink.value);
  });

  const effectiveSlug = computed(() => {
    if (locked.value && permalink.value?.publishedUrl) {
      return deriveSlugFromUrl(permalink.value.publishedUrl);
    }
    return trimmedSlug.value ?? permalink.value?.id ?? "";
  });

  const previewUrl = computed(() => {
    if (locked.value && permalink.value?.publishedUrl) {
      return permalink.value.publishedUrl;
    }
    return `${effectiveBase.value}/${effectiveSlug.value}`;
  });

  const previewSource = computed<PermalinkPreviewSource>(() => {
    if (trimmedBase.value !== null) return "permalink";
    return permalink.value?.fallbackBaseUrlSource ?? "instance";
  });

  const previewValid = computed(() => {
    if (!permalink.value) return false;
    if (locked.value) return true;
    if (trimmedBase.value !== null && !isBaseUrlValid(trimmedBase.value)) {
      return false;
    }
    if (trimmedSlug.value !== null && !isSlugValid(trimmedSlug.value)) {
      return false;
    }
    return effectiveBase.value.length > 0 && effectiveSlug.value.length > 0;
  });

  return { effectiveBase, effectiveSlug, previewUrl, previewSource, previewValid, locked };
}

/**
 * The GS1 identity path (`/01/{gtin}[/10/{batch}][/21/{serial}]`) of a gs1-link
 * permalink, parsed from its backend-authoritative `publicUrl` with the query
 * dropped.
 *
 * ponytail: `01` (GTIN) is always the leading Application Identifier of a GS1
 * Digital Link, so the first `/01/` marks where the identity path starts —
 * anything before it is the base's own path, which we recompute from the base
 * cascade. Returns "" when no `/01/` is present (e.g. the presentation-form
 * fallback the backend emits when the referenced UPI was deleted).
 */
function deriveGs1IdentityPath(publicUrl: string): string {
  try {
    const url = new URL(publicUrl);
    const idx = url.pathname.indexOf("/01/");
    return idx === -1 ? "" : url.pathname.slice(idx);
  } catch {
    return "";
  }
}

export interface Gs1LinkPreview {
  /** The live GS1 Digital Link URL: base cascade + identity path + attrs query. */
  previewUrl: ComputedRef<string>;
  /** True once published — the URL is frozen and the editor is read-only. */
  locked: ComputedRef<boolean>;
}

/**
 * Live preview of a gs1-link permalink's GS1 Digital Link URL while the user edits
 * its custom base URL and GS1 data attributes.
 *
 * Reuses the same three inputs the backend's `resolveGs1LinkPublicUrl` composes,
 * so the preview matches the persisted `publicUrl` with zero drift:
 * - **base** — the permalink base-URL cascade (typed override → `fallbackBaseUrl`),
 *   identical to {@link usePermalinkPreview}'s `effectiveBase`.
 * - **identity path** — kept verbatim from the backend's `publicUrl` (GTIN
 *   normalization stays backend-owned; the frontend never rebuilds the path).
 * - **query** — rebuilt live from the edited attrs via the shared
 *   `buildGs1DataAttributeQuery` (the very function the backend uses).
 *
 * Once published, the frozen `publishedUrl` is shown verbatim.
 */
export function useGs1LinkPreview(
  permalink: Ref<PermalinkPublicDto | undefined>,
  baseUrlInput: Ref<string>,
  gs1DataAttributes: Ref<Record<string, string>>,
): Gs1LinkPreview {
  const trimmedBase = computed(() => trimToNull(baseUrlInput.value));
  const locked = computed(() => Boolean(permalink.value?.publishedUrl));

  const effectiveBase = computed(() => {
    if (trimmedBase.value !== null) return canonicaliseBaseUrl(trimmedBase.value);
    if (!permalink.value) return "";
    return deriveFallbackBaseUrl(permalink.value);
  });

  const previewUrl = computed(() => {
    if (!permalink.value) return "";
    if (locked.value && permalink.value.publishedUrl) return permalink.value.publishedUrl;

    const identityPath = deriveGs1IdentityPath(permalink.value.publicUrl);
    // The attrs map only ever holds validated pairs (the editor emits nothing
    // else), but never trust the boundary: a bad pair yields a query-less
    // preview rather than a thrown render.
    let query = "";
    try {
      query = buildGs1DataAttributeQuery(gs1DataAttributes.value);
    } catch {
      query = "";
    }
    return `${effectiveBase.value}${identityPath}${query}`;
  });

  return { previewUrl, locked };
}
