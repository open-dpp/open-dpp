import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { gs1DataAttributesPlainFactory } from "@open-dpp/testing";
import { ZodError } from "zod";
import { Permalink } from "./permalink";

describe("Permalink", () => {
  const baseInput = () => ({
    kind: "presentation" as const,
    presentationConfigurationId: randomUUID(),
  });

  it("creates with a UUID id and null slug by default", () => {
    const permalink = Permalink.create(baseInput());

    expect(permalink.id).toBeTruthy();
    expect(permalink.slug).toBeNull();
    expect(permalink.createdAt).toBeInstanceOf(Date);
    expect(permalink.updatedAt).toBeInstanceOf(Date);
  });

  it("uses the supplied id when provided", () => {
    const id = randomUUID();
    const permalink = Permalink.create({ ...baseInput(), id });
    expect(permalink.id).toBe(id);
  });

  it("rejects a non-uuid presentationConfigurationId with ValueError", () => {
    try {
      Permalink.create({ presentationConfigurationId: "not-a-uuid" });
      throw new Error("expected create() to throw ValueError");
    } catch (error) {
      expect(error).toBeInstanceOf(ValueError);
      expect((error as Error).message).toContain("presentationConfigurationId");
      expect((error as Error).cause).toBeInstanceOf(ZodError);
    }
  });

  it("rejects a non-uuid id with ValueError", () => {
    try {
      Permalink.create({ ...baseInput(), id: "not-a-uuid" });
      throw new Error("expected create() to throw ValueError");
    } catch (error) {
      expect(error).toBeInstanceOf(ValueError);
      expect((error as Error).cause).toBeInstanceOf(ZodError);
    }
  });

  it("accepts a valid slug", () => {
    const permalink = Permalink.create({ ...baseInput(), slug: "acme-widget-v1" });
    expect(permalink.slug).toBe("acme-widget-v1");
  });

  it.each([
    ["UPPER"],
    ["-leading-dash"],
    ["trailing-dash-"],
    ["a"],
    ["contains_underscore"],
    ["has space"],
    ["café"],
    ["a".repeat(65)],
    [" leading-space"],
    ["trailing-space "],
    ["123"],
    ["new"],
    ["edit"],
    ["bidi\u202etext"],
  ])("rejects invalid slug %p with ValueError", (bad) => {
    expect(() => Permalink.create({ ...baseInput(), slug: bad })).toThrow(ValueError);
  });

  it("accepts explicit null slug", () => {
    const permalink = Permalink.create({ ...baseInput(), slug: null });
    expect(permalink.slug).toBeNull();
  });

  it("round-trips through toPlain/fromPlain", () => {
    const original = Permalink.create({ ...baseInput(), slug: "acme-widget" });

    const plain = original.toPlain();
    const restored = Permalink.fromPlain({
      ...plain,
      createdAt: plain.createdAt.toISOString(),
      updatedAt: plain.updatedAt.toISOString(),
    });

    expect(restored.id).toBe(original.id);
    expect(restored.slug).toBe(original.slug);
    expect(restored.presentationConfigurationId).toBe(original.presentationConfigurationId);
    expect(restored.createdAt.getTime()).toBe(original.createdAt.getTime());
    expect(restored.updatedAt.getTime()).toBe(original.updatedAt.getTime());
  });

  it("withSlug returns a new instance and bumps updatedAt", () => {
    const permalink = Permalink.create(baseInput());
    const originalUpdatedAt = permalink.updatedAt.getTime();

    const next = permalink.withSlug("my-slug");

    expect(next).not.toBe(permalink);
    expect(next.slug).toBe("my-slug");
    expect(next.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
    expect(next.createdAt.getTime()).toBe(permalink.createdAt.getTime());
  });

  it("withSlug(null) unsets the slug", () => {
    const permalink = Permalink.create({ ...baseInput(), slug: "to-remove" });

    const next = permalink.withSlug(null);

    expect(next.slug).toBeNull();
  });

  it("withSlug throws ValueError on bad input", () => {
    const permalink = Permalink.create(baseInput());

    expect(() => permalink.withSlug("BAD SLUG")).toThrow(ValueError);
  });

  it("fromPlain wraps invalid input as ValueError", () => {
    try {
      Permalink.fromPlain({});
      throw new Error("expected fromPlain() to throw ValueError");
    } catch (error) {
      expect(error).toBeInstanceOf(ValueError);
      expect(error).not.toBeInstanceOf(ZodError);
      expect((error as Error).cause).toBeInstanceOf(ZodError);
    }
  });

  it("fromPlain rehydrates legacy DB documents that lack baseUrl", () => {
    const id = randomUUID();
    const presentationConfigurationId = randomUUID();
    const isoNow = new Date().toISOString();
    const restored = Permalink.fromPlain({
      id,
      slug: null,
      presentationConfigurationId,
      createdAt: isoNow,
      updatedAt: isoNow,
    });

    expect(restored.baseUrl).toBeNull();
  });

  it("creates with null baseUrl by default", () => {
    const permalink = Permalink.create(baseInput());
    expect(permalink.baseUrl).toBeNull();
  });

  it("accepts a valid baseUrl", () => {
    const permalink = Permalink.create({
      ...baseInput(),
      baseUrl: "https://passports.example.com",
    });
    expect(permalink.baseUrl).toBe("https://passports.example.com");
  });

  it("canonicalises the baseUrl on create (lowercase host, no trailing slash)", () => {
    const permalink = Permalink.create({
      ...baseInput(),
      baseUrl: "https://Passports.Example.com/",
    });
    expect(permalink.baseUrl).toBe("https://passports.example.com");
  });

  it("rejects an invalid baseUrl with ValueError", () => {
    expect(() =>
      Permalink.create({ ...baseInput(), baseUrl: "https://example.com?query=1" }),
    ).toThrow(ValueError);
  });

  it("withBaseUrl returns a new instance and bumps updatedAt", () => {
    const permalink = Permalink.create(baseInput());
    const originalUpdatedAt = permalink.updatedAt.getTime();

    const next = permalink.withBaseUrl("https://passports.example.com");

    expect(next).not.toBe(permalink);
    expect(next.baseUrl).toBe("https://passports.example.com");
    expect(next.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
  });

  it("withBaseUrl(null) clears the override", () => {
    const permalink = Permalink.create({
      ...baseInput(),
      baseUrl: "https://passports.example.com",
    });

    const next = permalink.withBaseUrl(null);

    expect(next.baseUrl).toBeNull();
  });

  it("withBaseUrl throws ValueError on bad input", () => {
    const permalink = Permalink.create(baseInput());
    expect(() => permalink.withBaseUrl("not-a-url")).toThrow(ValueError);
  });

  it("creates with null publishedUrl by default", () => {
    const permalink = Permalink.create(baseInput());
    expect(permalink.publishedUrl).toBeNull();
  });

  it("withPublishedUrl sets the frozen URL, returns a new instance, bumps updatedAt", () => {
    const permalink = Permalink.create(baseInput());
    const originalUpdatedAt = permalink.updatedAt.getTime();

    const frozen = permalink.withPublishedUrl("https://passports.example.com/p/acme-widget");

    expect(frozen).not.toBe(permalink);
    expect(frozen.publishedUrl).toBe("https://passports.example.com/p/acme-widget");
    expect(frozen.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
    expect(frozen.createdAt.getTime()).toBe(permalink.createdAt.getTime());
  });

  it("withPublishedUrl throws ValueError when the URL is invalid", () => {
    const permalink = Permalink.create(baseInput());
    expect(() => permalink.withPublishedUrl("not-a-url")).toThrow(ValueError);
  });

  it("withPublishedUrl throws ValueError when publishedUrl is already set (immutable once frozen)", () => {
    const frozen = Permalink.create(baseInput()).withPublishedUrl(
      "https://passports.example.com/p/acme-widget",
    );
    expect(() => frozen.withPublishedUrl("https://other.example.com/p/acme-widget")).toThrow(
      ValueError,
    );
  });

  it("withSlug throws ValueError once the permalink is published (slug locked)", () => {
    const frozen = Permalink.create({ ...baseInput(), slug: "acme-widget" }).withPublishedUrl(
      "https://passports.example.com/p/acme-widget",
    );
    expect(() => frozen.withSlug("renamed")).toThrow(ValueError);
  });

  it("withBaseUrl throws ValueError once the permalink is published (baseUrl locked)", () => {
    const frozen = Permalink.create(baseInput()).withPublishedUrl(
      "https://passports.example.com/p/acme-widget",
    );
    expect(() => frozen.withBaseUrl("https://other.example.com")).toThrow(ValueError);
  });

  it("round-trips publishedUrl through toPlain/fromPlain", () => {
    const original = Permalink.create({ ...baseInput(), slug: "acme-widget" }).withPublishedUrl(
      "https://passports.example.com/p/acme-widget",
    );

    const plain = original.toPlain();
    const restored = Permalink.fromPlain({
      ...plain,
      createdAt: plain.createdAt.toISOString(),
      updatedAt: plain.updatedAt.toISOString(),
    });

    expect(restored.publishedUrl).toBe(original.publishedUrl);
  });

  it("fromPlain rehydrates legacy DB documents that lack publishedUrl as null", () => {
    const isoNow = new Date().toISOString();
    const restored = Permalink.fromPlain({
      id: randomUUID(),
      slug: null,
      presentationConfigurationId: randomUUID(),
      createdAt: isoNow,
      updatedAt: isoNow,
    });

    expect(restored.publishedUrl).toBeNull();
  });

  describe("polymorphism & new fields", () => {
    const upiId = randomUUID();
    const configId = randomUUID();

    // (1) create for a presentation permalink defaults kind, primary, uniqueProductIdentifierId, gs1DataAttributes
    it("create for a presentation permalink defaults new fields correctly", () => {
      const permalink = Permalink.create(baseInput());
      expect(permalink.kind).toBe("presentation");
      expect(permalink.primary).toBe(false);
      expect(permalink.uniqueProductIdentifierId).toBeNull();
      expect(permalink.gs1DataAttributes).toBeNull();
    });

    // (2) create for gs1-link succeeds and exposes readonly fields
    it("create for a gs1-link permalink succeeds and exposes readonly fields", () => {
      const permalink = Permalink.create({
        kind: "gs1-link",
        uniqueProductIdentifierId: upiId,
        presentationConfigurationId: null,
      });
      expect(permalink.kind).toBe("gs1-link");
      expect(permalink.uniqueProductIdentifierId).toBe(upiId);
      expect(permalink.presentationConfigurationId).toBeNull();
      expect(permalink.primary).toBe(false);
      expect(permalink.gs1DataAttributes).toBeNull();
    });

    // (3) create throws ValueError when gs1-link lacks uniqueProductIdentifierId
    it("create throws ValueError when gs1-link lacks uniqueProductIdentifierId", () => {
      expect(() =>
        Permalink.create({
          kind: "gs1-link",
          presentationConfigurationId: null,
          uniqueProductIdentifierId: undefined as unknown as string,
        }),
      ).toThrow(ValueError);
    });

    // (4) throws ValueError when presentation has null/missing presentationConfigurationId
    it("create throws ValueError when presentation permalink has null presentationConfigurationId", () => {
      expect(() =>
        Permalink.create({
          kind: "presentation",
          presentationConfigurationId: null as unknown as string,
        }),
      ).toThrow(ValueError);
    });

    // (5) throws ValueError when a presentation permalink is given gs1DataAttributes
    it("create throws ValueError when presentation permalink is given gs1DataAttributes", () => {
      expect(() =>
        Permalink.create({
          kind: "presentation",
          presentationConfigurationId: configId,
          gs1DataAttributes: gs1DataAttributesPlainFactory.build(),
        } as Parameters<typeof Permalink.create>[0]),
      ).toThrow(ValueError);
    });

    // (6) toPlain() includes new fields and round-trips through fromPlain for both kinds
    it("toPlain includes new fields and round-trips through fromPlain for presentation kind", () => {
      const original = Permalink.create({
        kind: "presentation",
        presentationConfigurationId: configId,
        slug: "my-product",
      });
      const plain = original.toPlain();
      expect(plain.kind).toBe("presentation");
      expect(plain.primary).toBe(false);
      expect(plain.uniqueProductIdentifierId).toBeNull();
      expect(plain.gs1DataAttributes).toBeNull();

      const restored = Permalink.fromPlain({
        ...plain,
        createdAt: plain.createdAt.toISOString(),
        updatedAt: plain.updatedAt.toISOString(),
      });
      expect(restored.kind).toBe("presentation");
      expect(restored.primary).toBe(false);
      expect(restored.uniqueProductIdentifierId).toBeNull();
      expect(restored.gs1DataAttributes).toBeNull();
    });

    it("toPlain includes new fields and round-trips through fromPlain for gs1-link kind", () => {
      const gs1Attributes = gs1DataAttributesPlainFactory.build();
      const original = Permalink.create({
        kind: "gs1-link",
        uniqueProductIdentifierId: upiId,
        presentationConfigurationId: null,
        gs1DataAttributes: gs1Attributes,
      });
      const plain = original.toPlain();
      expect(plain.kind).toBe("gs1-link");
      expect(plain.uniqueProductIdentifierId).toBe(upiId);
      expect(plain.gs1DataAttributes).toEqual(gs1Attributes);

      const restored = Permalink.fromPlain({
        ...plain,
        createdAt: plain.createdAt.toISOString(),
        updatedAt: plain.updatedAt.toISOString(),
      });
      expect(restored.kind).toBe("gs1-link");
      expect(restored.uniqueProductIdentifierId).toBe(upiId);
      expect(restored.gs1DataAttributes).toEqual(gs1Attributes);
    });

    // (7) fromPlain rehydrates a legacy doc (defaults)
    it("fromPlain rehydrates a legacy doc lacking kind/primary/gs1 fields with defaults", () => {
      const isoNow = new Date().toISOString();
      const restored = Permalink.fromPlain({
        id: randomUUID(),
        slug: null,
        presentationConfigurationId: configId,
        createdAt: isoNow,
        updatedAt: isoNow,
      });
      expect(restored.kind).toBe("presentation");
      expect(restored.primary).toBe(false);
      expect(restored.uniqueProductIdentifierId).toBeNull();
      expect(restored.gs1DataAttributes).toBeNull();
    });
  });

  describe("new withX methods", () => {
    const configId = randomUUID();
    const upiId = randomUUID();

    const makePresentation = () =>
      Permalink.create({
        kind: "presentation",
        presentationConfigurationId: configId,
        slug: "my-product",
        baseUrl: "https://passports.example.com",
      });

    const makeGs1Link = () =>
      Permalink.create({
        kind: "gs1-link",
        uniqueProductIdentifierId: upiId,
        presentationConfigurationId: null,
      });

    const makePublishedGs1Link = () =>
      makeGs1Link().withPublishedUrl("https://id.example.com/01/04006381333931");

    // (1) withPrimary
    it("withPrimary(true) returns a new instance with primary:true, bumps updatedAt, preserves createdAt", () => {
      const original = makePresentation();
      const originalUpdatedAt = original.updatedAt.getTime();
      const createdAt = original.createdAt.getTime();

      const next = original.withPrimary(true);

      expect(next).not.toBe(original);
      expect(next.primary).toBe(true);
      expect(next.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
      expect(next.createdAt.getTime()).toBe(createdAt);
    });

    it("withPrimary(false) clears primary", () => {
      const original = makePresentation().withPrimary(true);
      const next = original.withPrimary(false);
      expect(next.primary).toBe(false);
    });

    // (5) withGs1DataAttributes on a gs1-link returns a new instance
    it("withGs1DataAttributes sets valid attributes on a gs1-link", () => {
      const gs1Attributes = gs1DataAttributesPlainFactory.build();
      const original = makeGs1Link();
      const next = original.withGs1DataAttributes(gs1Attributes);
      expect(next).not.toBe(original);
      expect(next.gs1DataAttributes).toEqual(gs1Attributes);
    });

    it("withGs1DataAttributes(null) clears the data attributes", () => {
      const original = makeGs1Link().withGs1DataAttributes(gs1DataAttributesPlainFactory.build());
      const next = original.withGs1DataAttributes(null);
      expect(next.gs1DataAttributes).toBeNull();
    });

    it("withGs1DataAttributes throws ValueError on an invalid AI map", () => {
      const original = makeGs1Link();
      // "01" is a key AI (identifier), not a data attribute
      expect(() => original.withGs1DataAttributes({ "01": "04006381333931" })).toThrow(ValueError);
    });

    it("withGs1DataAttributes throws ValueError on a presentation permalink", () => {
      const original = makePresentation();
      expect(() => original.withGs1DataAttributes(gs1DataAttributesPlainFactory.build())).toThrow(
        ValueError,
      );
    });

    // (6) freeze decision: withPrimary is ALLOWED post-publish
    it("withPrimary is allowed after publish (primary governs resolution)", () => {
      const frozen = makePresentation().withPublishedUrl(
        "https://passports.example.com/p/my-product",
      );
      expect(() => frozen.withPrimary(true)).not.toThrow();
      const next = frozen.withPrimary(true);
      expect(next.primary).toBe(true);
    });

    // (6) withGs1DataAttributes follows assertNotPublished (throws once published)
    it("withGs1DataAttributes throws ValueError once published", () => {
      const frozen = makePublishedGs1Link();
      expect(() => frozen.withGs1DataAttributes(gs1DataAttributesPlainFactory.build())).toThrow(
        ValueError,
      );
    });

    // (7) each gs1 mutator preserves id, slug, baseUrl, publishedUrl, kind, uniqueProductIdentifierId
    it("withGs1DataAttributes preserves id, slug, baseUrl, publishedUrl, kind, uniqueProductIdentifierId", () => {
      const original = Permalink.create({
        kind: "gs1-link",
        uniqueProductIdentifierId: upiId,
        presentationConfigurationId: null,
      });
      const next = original.withGs1DataAttributes(gs1DataAttributesPlainFactory.build());
      expect(next.id).toBe(original.id);
      expect(next.slug).toBe(original.slug);
      expect(next.baseUrl).toBe(original.baseUrl);
      expect(next.publishedUrl).toBe(original.publishedUrl);
      expect(next.kind).toBe(original.kind);
      expect(next.uniqueProductIdentifierId).toBe(original.uniqueProductIdentifierId);
    });
  });
});
