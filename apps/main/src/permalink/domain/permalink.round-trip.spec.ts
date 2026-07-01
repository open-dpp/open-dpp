import { permalinksPlainFactory } from "@open-dpp/testing";
import { Permalink } from "./permalink";

describe("Permalink fromPlain -> toPlain round-trip", () => {
  it("preserves a presentation permalink and null-defaults baseUrl/publishedUrl/organizationId", () => {
    const plain = permalinksPlainFactory.build();

    const result = Permalink.fromPlain(plain).toPlain();

    expect(result).toEqual({
      id: plain.id,
      kind: plain.kind,
      slug: plain.slug,
      baseUrl: null,
      publishedUrl: null,
      presentationConfigurationId: plain.presentationConfigurationId,
      primary: plain.primary,
      uniqueProductIdentifierId: plain.uniqueProductIdentifierId,
      gs1DataAttributes: plain.gs1DataAttributes,
      organizationId: null,
      createdAt: new Date(plain.createdAt),
      updatedAt: new Date(plain.updatedAt),
    });
  });

  it("preserves a gs1-link permalink's kind, uniqueProductIdentifierId and gs1DataAttributes", () => {
    const plain = permalinksPlainFactory.build({}, { transient: { gs1: true } });

    const result = Permalink.fromPlain(plain).toPlain();

    expect(result.kind).toBe("gs1-link");
    expect(result.presentationConfigurationId).toBeNull();
    expect(result.uniqueProductIdentifierId).toBe(plain.uniqueProductIdentifierId);
    expect(result.gs1DataAttributes).toEqual(plain.gs1DataAttributes);
  });

  it("preserves explicitly-set slug, baseUrl, publishedUrl and organizationId", () => {
    const plain = permalinksPlainFactory.build({
      slug: "my-slug",
      baseUrl: "https://base.example",
      publishedUrl: "https://pub.example/p",
    });

    const result = Permalink.fromPlain({ ...plain, organizationId: "org-123" }).toPlain();

    expect(result.slug).toBe("my-slug");
    expect(result.baseUrl).toBe("https://base.example");
    expect(result.publishedUrl).toBe("https://pub.example/p");
    expect(result.organizationId).toBe("org-123");
  });
});
