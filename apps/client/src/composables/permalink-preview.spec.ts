import type { PermalinkPublicDto } from "@open-dpp/dto";
import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePermalinkPreview } from "./permalink-preview.ts";

const permalinkId = "11111111-1111-4111-8111-111111111111";
const configId = "22222222-2222-4222-8222-222222222222";
const isoNow = "2026-05-12T00:00:00.000Z";

function makePermalink(overrides: Partial<PermalinkPublicDto> = {}): PermalinkPublicDto {
  return {
    id: permalinkId,
    slug: null,
    baseUrl: null,
    presentationConfigurationId: configId,
    createdAt: isoNow,
    updatedAt: isoNow,
    publicUrl: `https://instance.example.com/p/${permalinkId}`,
    fallbackBaseUrl: "https://branding.example.com",
    fallbackBaseUrlSource: "branding",
    ...overrides,
  };
}

describe("usePermalinkPreview", () => {
  it("derives preview from typed inputs (source = 'permalink')", () => {
    const permalink = ref<PermalinkPublicDto | undefined>(makePermalink());
    const slug = ref("acme-widget");
    const baseUrl = ref("https://override.example.com");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.effectiveBase.value).toBe("https://override.example.com");
    expect(preview.effectiveSlug.value).toBe("acme-widget");
    expect(preview.previewUrl.value).toBe("https://override.example.com/p/acme-widget");
    expect(preview.previewSource.value).toBe("permalink");
    expect(preview.previewValid.value).toBe(true);
  });

  it("falls back to the org branding when base URL input is empty", () => {
    const permalink = ref<PermalinkPublicDto | undefined>(
      makePermalink({
        fallbackBaseUrl: "https://branding.example.com",
        fallbackBaseUrlSource: "branding",
      }),
    );
    const slug = ref("acme-widget");
    const baseUrl = ref("");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.effectiveBase.value).toBe("https://branding.example.com");
    expect(preview.previewUrl.value).toBe("https://branding.example.com/p/acme-widget");
    expect(preview.previewSource.value).toBe("branding");
    expect(preview.previewValid.value).toBe(true);
  });

  it("falls back to the instance default when branding has no permalinkBaseUrl", () => {
    const permalink = ref<PermalinkPublicDto | undefined>(
      makePermalink({
        fallbackBaseUrl: "https://instance.example.com",
        fallbackBaseUrlSource: "instance",
      }),
    );
    const slug = ref("acme-widget");
    const baseUrl = ref("");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.effectiveBase.value).toBe("https://instance.example.com");
    expect(preview.previewSource.value).toBe("instance");
    expect(preview.previewValid.value).toBe(true);
  });

  it("falls back to permalink.id when slug input is empty", () => {
    const permalink = ref<PermalinkPublicDto | undefined>(makePermalink());
    const slug = ref("");
    const baseUrl = ref("https://override.example.com");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.effectiveSlug.value).toBe(permalinkId);
    expect(preview.previewUrl.value).toBe(`https://override.example.com/p/${permalinkId}`);
  });

  it("treats whitespace-only input as empty (trim semantics)", () => {
    const permalink = ref<PermalinkPublicDto | undefined>(makePermalink());
    const slug = ref("   ");
    const baseUrl = ref("   ");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.effectiveBase.value).toBe(permalink.value!.fallbackBaseUrl);
    expect(preview.effectiveSlug.value).toBe(permalinkId);
    expect(preview.previewSource.value).toBe("branding");
  });

  it("reacts to slug input changes", () => {
    const permalink = ref<PermalinkPublicDto | undefined>(makePermalink());
    const slug = ref("");
    const baseUrl = ref("");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.previewUrl.value).toBe(`${permalink.value!.fallbackBaseUrl}/p/${permalinkId}`);

    slug.value = "new-slug";
    expect(preview.previewUrl.value).toBe(`${permalink.value!.fallbackBaseUrl}/p/new-slug`);
  });

  it("reacts to base URL input changes (and switches source)", () => {
    const permalink = ref<PermalinkPublicDto | undefined>(makePermalink());
    const slug = ref("acme-widget");
    const baseUrl = ref("");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.previewSource.value).toBe("branding");

    baseUrl.value = "https://override.example.com";
    expect(preview.previewSource.value).toBe("permalink");
    expect(preview.effectiveBase.value).toBe("https://override.example.com");
  });

  it("canonicalises a base URL input with trailing slash to its origin", () => {
    const permalink = ref<PermalinkPublicDto | undefined>(makePermalink());
    const slug = ref("acme-widget");
    const baseUrl = ref("https://Override.Example.com/");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.effectiveBase.value).toBe("https://override.example.com");
  });

  it("marks the preview invalid when the base URL input has a path", () => {
    const permalink = ref<PermalinkPublicDto | undefined>(makePermalink());
    const slug = ref("acme-widget");
    const baseUrl = ref("https://example.com/with-path");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.previewValid.value).toBe(false);
  });

  it("marks the preview invalid for a non-http(s) scheme", () => {
    const permalink = ref<PermalinkPublicDto | undefined>(makePermalink());
    const slug = ref("acme-widget");
    const baseUrl = ref("ftp://example.com");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.previewValid.value).toBe(false);
  });

  it("marks the preview invalid for a slug with disallowed characters", () => {
    const permalink = ref<PermalinkPublicDto | undefined>(makePermalink());
    const slug = ref("BAD SLUG");
    const baseUrl = ref("https://override.example.com");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.previewValid.value).toBe(false);
  });

  it("marks the preview invalid for a reserved slug", () => {
    const permalink = ref<PermalinkPublicDto | undefined>(makePermalink());
    const slug = ref("new");
    const baseUrl = ref("https://override.example.com");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.previewValid.value).toBe(false);
  });

  it("marks the preview invalid when the permalink hasn't loaded yet", () => {
    const permalink = ref<PermalinkPublicDto | undefined>(undefined);
    const slug = ref("acme-widget");
    const baseUrl = ref("https://override.example.com");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.previewValid.value).toBe(false);
  });

  it("degrades gracefully when the server response lacks fallbackBaseUrl (older backend)", () => {
    // Same-version pairs always populate `fallbackBaseUrl`. This guards
    // against a frontend running against an older backend mid-deploy — the
    // preview parses the origin from `publicUrl` so it stays usable.
    const permalink = ref<PermalinkPublicDto | undefined>(
      makePermalink({
        fallbackBaseUrl: undefined as unknown as string,
        publicUrl: `https://instance.example.com/p/${permalinkId}`,
      }),
    );
    const slug = ref("");
    const baseUrl = ref("");

    const preview = usePermalinkPreview(permalink, slug, baseUrl);

    expect(preview.effectiveBase.value).toBe("https://instance.example.com");
    expect(preview.previewValid.value).toBe(true);
  });
});
