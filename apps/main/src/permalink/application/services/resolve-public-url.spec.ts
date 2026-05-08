import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { Branding } from "../../../branding/domain/branding";
import { Permalink } from "../../domain/permalink";
import { resolvePublicUrl } from "./permalink.application.service";

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

    expect(result).toEqual("https://override.example.com/p/acme-widget");
  });

  it("falls back to branding.permalinkBaseUrl when permalink.baseUrl is null", () => {
    const permalink = makePermalink({ slug: "acme-widget" });
    const branding = Branding.create({
      organizationId: "org",
      permalinkBaseUrl: "https://branding.example.com",
    });

    const result = resolvePublicUrl(permalink, branding, ENV_FALLBACK);

    expect(result).toEqual("https://branding.example.com/p/acme-widget");
  });

  it("falls back to OPEN_DPP_URL when neither permalink nor branding has a base URL", () => {
    const permalink = makePermalink({ slug: "acme-widget" });
    const branding = Branding.create({ organizationId: "org" });

    const result = resolvePublicUrl(permalink, branding, ENV_FALLBACK);

    expect(result).toEqual(`${ENV_FALLBACK}/p/acme-widget`);
  });

  it("normalises OPEN_DPP_URL to its origin (drops trailing slash)", () => {
    const permalink = makePermalink({ slug: "acme-widget" });
    const branding = Branding.create({ organizationId: "org" });

    const result = resolvePublicUrl(permalink, branding, "https://instance.example.com/");

    expect(result).toEqual("https://instance.example.com/p/acme-widget");
  });

  it("uses the UUID when no slug is set", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const permalink = Permalink.create({
      id,
      presentationConfigurationId: randomUUID(),
    });
    const branding = Branding.create({ organizationId: "org" });

    const result = resolvePublicUrl(permalink, branding, ENV_FALLBACK);

    expect(result).toEqual(`${ENV_FALLBACK}/p/${id}`);
  });

  it("handles a null branding (org has no branding row yet)", () => {
    const permalink = makePermalink({ slug: "acme-widget" });

    const result = resolvePublicUrl(permalink, null, ENV_FALLBACK);

    expect(result).toEqual(`${ENV_FALLBACK}/p/acme-widget`);
  });
});
