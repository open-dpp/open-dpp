import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { Branding } from "../../../branding/domain/branding";
import { Permalink } from "../../domain/permalink";
import { resolveFallbackBaseUrl, resolvePublicUrl } from "./permalink.application.service";

const ENV_FALLBACK = "https://instance.example.com";

function makePermalink(opts: { slug?: string | null; baseUrl?: string | null } = {}) {
  return Permalink.create({
    presentationConfigurationId: randomUUID(),
    slug: opts.slug ?? null,
    baseUrl: opts.baseUrl ?? null,
  });
}

describe("resolvePublicUrl", () => {
  it("uses permalink.baseUrl when set (highest precedence)", () => {
    const permalink = makePermalink({
      slug: "acme-widget",
      baseUrl: "https://override.example.com",
    });
    const branding = Branding.create({
      organizationId: "org",
      permalinkBaseUrl: "https://branding.example.com",
    });

    const result = resolvePublicUrl(permalink, branding, ENV_FALLBACK);

    expect(result).toEqual("https://override.example.com/acme-widget");
  });

  it("falls back to branding.permalinkBaseUrl when permalink.baseUrl is null", () => {
    const permalink = makePermalink({ slug: "acme-widget" });
    const branding = Branding.create({
      organizationId: "org",
      permalinkBaseUrl: "https://branding.example.com",
    });

    const result = resolvePublicUrl(permalink, branding, ENV_FALLBACK);

    expect(result).toEqual("https://branding.example.com/acme-widget");
  });

  it("falls back to OPEN_DPP_URL when neither permalink nor branding has a base URL", () => {
    const permalink = makePermalink({ slug: "acme-widget" });
    const branding = Branding.create({ organizationId: "org" });

    const result = resolvePublicUrl(permalink, branding, ENV_FALLBACK);

    expect(result).toEqual(`${ENV_FALLBACK}/acme-widget`);
  });

  it("canonicalises OPEN_DPP_URL (drops trailing slash)", () => {
    const permalink = makePermalink({ slug: "acme-widget" });
    const branding = Branding.create({ organizationId: "org" });

    const result = resolvePublicUrl(permalink, branding, "https://instance.example.com/");

    expect(result).toEqual("https://instance.example.com/acme-widget");
  });

  it("preserves a path on OPEN_DPP_URL (no /p/ injection)", () => {
    const permalink = makePermalink({ slug: "acme-widget" });
    const branding = Branding.create({ organizationId: "org" });

    const result = resolvePublicUrl(permalink, branding, "https://instance.example.com/p");

    expect(result).toEqual("https://instance.example.com/p/acme-widget");
  });

  it("preserves a path on OPEN_DPP_URL even with a trailing slash", () => {
    const permalink = makePermalink({ slug: "acme-widget" });
    const branding = Branding.create({ organizationId: "org" });

    const result = resolvePublicUrl(permalink, branding, "https://instance.example.com/p/");

    expect(result).toEqual("https://instance.example.com/p/acme-widget");
  });

  it("preserves a path on branding.permalinkBaseUrl", () => {
    const permalink = makePermalink({ slug: "acme-widget" });
    const branding = Branding.create({
      organizationId: "org",
      permalinkBaseUrl: "https://branding.example.com/dpp",
    });

    const result = resolvePublicUrl(permalink, branding, ENV_FALLBACK);

    expect(result).toEqual("https://branding.example.com/dpp/acme-widget");
  });

  it("uses the UUID when no slug is set", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const permalink = Permalink.create({
      id,
      presentationConfigurationId: randomUUID(),
    });
    const branding = Branding.create({ organizationId: "org" });

    const result = resolvePublicUrl(permalink, branding, ENV_FALLBACK);

    expect(result).toEqual(`${ENV_FALLBACK}/${id}`);
  });

  it("handles a null branding (org has no branding row yet)", () => {
    const permalink = makePermalink({ slug: "acme-widget" });

    const result = resolvePublicUrl(permalink, null, ENV_FALLBACK);

    expect(result).toEqual(`${ENV_FALLBACK}/acme-widget`);
  });
});

describe("resolveFallbackBaseUrl", () => {
  it("returns branding.permalinkBaseUrl when set, attributing source to 'branding'", () => {
    const branding = Branding.create({
      organizationId: "org",
      permalinkBaseUrl: "https://branding.example.com",
    });

    const result = resolveFallbackBaseUrl(branding, ENV_FALLBACK);

    expect(result).toEqual({ url: "https://branding.example.com", source: "branding" });
  });

  it("falls back to the env URL when branding has no permalinkBaseUrl", () => {
    const branding = Branding.create({ organizationId: "org" });

    const result = resolveFallbackBaseUrl(branding, ENV_FALLBACK);

    expect(result).toEqual({ url: ENV_FALLBACK, source: "instance" });
  });

  it("falls back to the env URL when branding itself is null", () => {
    const result = resolveFallbackBaseUrl(null, ENV_FALLBACK);

    expect(result).toEqual({ url: ENV_FALLBACK, source: "instance" });
  });

  it("canonicalises the env URL (drops trailing slash)", () => {
    const result = resolveFallbackBaseUrl(null, "https://instance.example.com/");

    expect(result).toEqual({ url: "https://instance.example.com", source: "instance" });
  });

  it("preserves a path on the env URL", () => {
    const result = resolveFallbackBaseUrl(null, "https://instance.example.com/p");

    expect(result).toEqual({ url: "https://instance.example.com/p", source: "instance" });
  });

  it("ignores the per-permalink override (returns the post-override link in the chain)", () => {
    const branding = Branding.create({
      organizationId: "org",
      permalinkBaseUrl: "https://branding.example.com",
    });

    const result = resolveFallbackBaseUrl(branding, ENV_FALLBACK);

    expect(result.url).toEqual("https://branding.example.com");
  });
});
