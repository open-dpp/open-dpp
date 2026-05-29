import type { PermalinkFallbackBaseUrlSource, PermalinkPublicDto } from "@open-dpp/dto";
import {
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
