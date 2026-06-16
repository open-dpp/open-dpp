import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { PermalinkKind } from "@open-dpp/dto";
import { Branding } from "../../../branding/domain/branding";
import { Permalink } from "../../domain/permalink";
import {
  resolveFallbackBaseUrl,
  resolveGs1ResolverBase,
  resolvePublicUrl,
} from "./permalink.application.service";

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

function makeGs1Permalink(
  opts: { gs1ResolverBase?: string | null } = {},
): Permalink {
  return Permalink.create({
    kind: PermalinkKind.GS1_LINK,
    uniqueProductIdentifierId: randomUUID(),
    gs1ResolverBase: opts.gs1ResolverBase ?? null,
  });
}

describe("resolveGs1ResolverBase", () => {
  it("returns the permalink's gs1ResolverBase when set, overriding branding gs1ResolverBaseUrl", () => {
    const permalink = makeGs1Permalink({
      gs1ResolverBase: "https://resolver.override.example.com",
    });
    const branding = Branding.create({
      organizationId: "org",
      gs1ResolverBaseUrl: "https://resolver.branding.example.com",
    });

    const result = resolveGs1ResolverBase(permalink, branding, "https://instance.example.com");

    expect(result).toEqual("https://resolver.override.example.com");
  });

  it("returns the permalink's gs1ResolverBase, overriding the instance fallback", () => {
    const permalink = makeGs1Permalink({
      gs1ResolverBase: "https://resolver.override.example.com",
    });
    const branding = Branding.create({ organizationId: "org" });

    const result = resolveGs1ResolverBase(permalink, branding, "https://instance.example.com");

    expect(result).toEqual("https://resolver.override.example.com");
  });

  it("falls back to branding.gs1ResolverBaseUrl when permalink.gs1ResolverBase is null", () => {
    const permalink = makeGs1Permalink({ gs1ResolverBase: null });
    const branding = Branding.create({
      organizationId: "org",
      gs1ResolverBaseUrl: "https://resolver.branding.example.com",
    });

    const result = resolveGs1ResolverBase(permalink, branding, "https://instance.example.com");

    expect(result).toEqual("https://resolver.branding.example.com");
  });

  it("falls back to the instance (OPEN_DPP_URL) when both permalink.gs1ResolverBase and branding.gs1ResolverBaseUrl are null", () => {
    const permalink = makeGs1Permalink({ gs1ResolverBase: null });
    const branding = Branding.create({ organizationId: "org" });

    const result = resolveGs1ResolverBase(permalink, branding, "https://instance.example.com");

    expect(result).toEqual("https://instance.example.com");
  });

  it("falls back to the instance (OPEN_DPP_URL) when branding is null", () => {
    const permalink = makeGs1Permalink({ gs1ResolverBase: null });

    const result = resolveGs1ResolverBase(permalink, null, "https://instance.example.com");

    expect(result).toEqual("https://instance.example.com");
  });

  it("canonicalises the override — lowercases host", () => {
    const permalink = makeGs1Permalink({
      gs1ResolverBase: "https://RESOLVER.Example.COM",
    });

    const result = resolveGs1ResolverBase(permalink, null, "https://instance.example.com");

    expect(result).toEqual("https://resolver.example.com");
  });

  it("canonicalises the override — drops trailing slash", () => {
    const permalink = makeGs1Permalink({
      gs1ResolverBase: "https://resolver.example.com/",
    });

    const result = resolveGs1ResolverBase(permalink, null, "https://instance.example.com");

    expect(result).toEqual("https://resolver.example.com");
  });

  it("canonicalises the instance fallback — drops trailing slash", () => {
    const permalink = makeGs1Permalink({ gs1ResolverBase: null });

    const result = resolveGs1ResolverBase(permalink, null, "https://instance.example.com/");

    expect(result).toEqual("https://instance.example.com");
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
