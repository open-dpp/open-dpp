import type { PermalinkFallbackBaseUrlSource, PermalinkPublicDto } from "@open-dpp/dto";
import {
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

function canonicaliseBaseUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hostname = url.hostname.toLowerCase();
    return url.origin;
  } catch {
    return value;
  }
}

const reservedSlugs = new Set<string>(PERMALINK_RESERVED_SLUGS);

function isSlugValid(value: string): boolean {
  if (reservedSlugs.has(value)) return false;
  return PermalinkSlugSchema.safeParse(value).success;
}

function isBaseUrlValid(value: string): boolean {
  return PermalinkBaseUrlSchema.safeParse(value).success;
}

function deriveFallbackBaseUrl(permalink: PermalinkPublicDto): string {
  if (permalink.fallbackBaseUrl) return permalink.fallbackBaseUrl;
  try {
    return new URL(permalink.publicUrl).origin;
  } catch {
    return "";
  }
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
      return canonicaliseBaseUrl(permalink.value.publishedUrl);
    }
    if (trimmedBase.value !== null) {
      return canonicaliseBaseUrl(trimmedBase.value);
    }
    if (!permalink.value) return "";
    return deriveFallbackBaseUrl(permalink.value);
  });

  const effectiveSlug = computed(() => trimmedSlug.value ?? permalink.value?.id ?? "");

  const previewUrl = computed(() => {
    if (locked.value && permalink.value?.publishedUrl) {
      return permalink.value.publishedUrl;
    }
    return `${effectiveBase.value}/p/${effectiveSlug.value}`;
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
