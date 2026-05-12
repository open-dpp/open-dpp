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
}

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

// Canonicalises a user-typed base URL the same way `PermalinkBaseUrlSchema`
// does on the server (lowercase host, origin only). The preview should match
// what the server will persist on save.
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

// Defensive: derive a fallback base URL from the loaded permalink when the
// server hasn't shipped `fallbackBaseUrl`. Same-version client + server pairs
// always have the field, but a frontend running against an older backend (e.g.
// during deploy, or before a backend restart picks up new code) shouldn't
// crash into an "invalid preview" state — parsing the origin from the
// resolved `publicUrl` is a correct approximation when the user hasn't set a
// per-permalink override (because then the resolved origin *is* the
// fallback).
function deriveFallbackBaseUrl(permalink: PermalinkPublicDto): string {
  if (permalink.fallbackBaseUrl) return permalink.fallbackBaseUrl;
  try {
    return new URL(permalink.publicUrl).origin;
  } catch {
    return "";
  }
}

// Live preview derivation for the permalink settings dialog. Pure reactive
// transformation of the two text inputs plus the loaded permalink — surfaces
// the post-override fallback supplied by the server so clearing the base URL
// updates the preview immediately rather than waiting for a round-trip.
export function usePermalinkPreview(
  permalink: Ref<PermalinkPublicDto | undefined>,
  slugInput: Ref<string>,
  baseUrlInput: Ref<string>,
): PermalinkPreview {
  const trimmedBase = computed(() => trimToNull(baseUrlInput.value));
  const trimmedSlug = computed(() => trimToNull(slugInput.value));

  const effectiveBase = computed(() => {
    if (trimmedBase.value !== null) {
      return canonicaliseBaseUrl(trimmedBase.value);
    }
    if (!permalink.value) return "";
    return deriveFallbackBaseUrl(permalink.value);
  });

  const effectiveSlug = computed(() => trimmedSlug.value ?? permalink.value?.id ?? "");

  const previewUrl = computed(() => `${effectiveBase.value}/p/${effectiveSlug.value}`);

  const previewSource = computed<PermalinkPreviewSource>(() => {
    if (trimmedBase.value !== null) return "permalink";
    return permalink.value?.fallbackBaseUrlSource ?? "instance";
  });

  const previewValid = computed(() => {
    if (!permalink.value) return false;
    if (trimmedBase.value !== null && !isBaseUrlValid(trimmedBase.value)) {
      return false;
    }
    if (trimmedSlug.value !== null && !isSlugValid(trimmedSlug.value)) {
      return false;
    }
    return effectiveBase.value.length > 0 && effectiveSlug.value.length > 0;
  });

  return { effectiveBase, effectiveSlug, previewUrl, previewSource, previewValid };
}
