import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { gs1DataAttributesPlainFactory } from "@open-dpp/testing";
import { ZodError } from "zod";
import { Permalink } from "./permalink";

describe("Permalink", () => {
  const baseInput = () => ({
    kind: "open-dpp" as const,
    passportId: randomUUID(),
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

  it("defaults kind to open-dpp when omitted", () => {
    const permalink = Permalink.create({ passportId: randomUUID() });
    expect(permalink.kind).toBe("open-dpp");
  });

  it("creates a bare open-dpp permalink (no config, no UPI)", () => {
    const passportId = randomUUID();
    const permalink = Permalink.create({ kind: "open-dpp", passportId });
    expect(permalink.passportId).toBe(passportId);
    expect(permalink.presentationConfigurationId).toBeNull();
    expect(permalink.uniqueProductIdentifierId).toBeNull();
  });

  it("creates an open-dpp permalink bound to a UPI", () => {
    const upiId = randomUUID();
    const permalink = Permalink.create({
      kind: "open-dpp",
      passportId: randomUUID(),
      uniqueProductIdentifierId: upiId,
    });
    expect(permalink.uniqueProductIdentifierId).toBe(upiId);
    expect(permalink.gs1DataAttributes).toBeNull();
  });

  it("rejects a missing passportId with ValueError", () => {
    expect(() =>
      Permalink.create({ kind: "open-dpp", presentationConfigurationId: randomUUID() } as never),
    ).toThrow(ValueError);
  });

  it("rejects a non-uuid presentationConfigurationId with ValueError", () => {
    try {
      Permalink.create({
        passportId: randomUUID(),
        presentationConfigurationId: "not-a-uuid",
      });
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
    ["bidi‮text"],
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
    expect(restored.passportId).toBe(original.passportId);
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

  it("fromPlain rejects a plain object lacking passportId", () => {
    const isoNow = new Date().toISOString();
    expect(() =>
      Permalink.fromPlain({
        id: randomUUID(),
        slug: null,
        presentationConfigurationId: randomUUID(),
        createdAt: isoNow,
        updatedAt: isoNow,
      }),
    ).toThrow(ValueError);
  });

  it("fromPlain rehydrates documents that lack baseUrl", () => {
    const id = randomUUID();
    const isoNow = new Date().toISOString();
    const restored = Permalink.fromPlain({
      id,
      passportId: randomUUID(),
      slug: null,
      presentationConfigurationId: randomUUID(),
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

  describe("polymorphism", () => {
    const upiId = randomUUID();
    const configId = randomUUID();

    it("create for an open-dpp permalink defaults optional fields correctly", () => {
      const permalink = Permalink.create(baseInput());
      expect(permalink.kind).toBe("open-dpp");
      expect(permalink.uniqueProductIdentifierId).toBeNull();
      expect(permalink.gs1DataAttributes).toBeNull();
    });

    it("create for a gs1-link permalink succeeds and exposes readonly fields", () => {
      const passportId = randomUUID();
      const permalink = Permalink.create({
        kind: "gs1-link",
        passportId,
        uniqueProductIdentifierId: upiId,
        presentationConfigurationId: null,
      });
      expect(permalink.kind).toBe("gs1-link");
      expect(permalink.passportId).toBe(passportId);
      expect(permalink.uniqueProductIdentifierId).toBe(upiId);
      expect(permalink.presentationConfigurationId).toBeNull();
      expect(permalink.gs1DataAttributes).toBeNull();
    });

    it("create throws ValueError when gs1-link lacks uniqueProductIdentifierId", () => {
      expect(() =>
        Permalink.create({
          kind: "gs1-link",
          passportId: randomUUID(),
          presentationConfigurationId: null,
          uniqueProductIdentifierId: undefined as unknown as string,
        }),
      ).toThrow(ValueError);
    });

    it("create throws ValueError when gs1-link lacks passportId", () => {
      expect(() =>
        Permalink.create({
          kind: "gs1-link",
          uniqueProductIdentifierId: upiId,
          presentationConfigurationId: null,
        } as never),
      ).toThrow(ValueError);
    });

    it("create throws ValueError when an open-dpp permalink is given gs1DataAttributes", () => {
      expect(() =>
        Permalink.create({
          kind: "open-dpp",
          passportId: randomUUID(),
          presentationConfigurationId: configId,
          gs1DataAttributes: gs1DataAttributesPlainFactory.build(),
        } as Parameters<typeof Permalink.create>[0]),
      ).toThrow(ValueError);
    });

    it("toPlain includes all fields and round-trips through fromPlain for open-dpp kind", () => {
      const original = Permalink.create({
        kind: "open-dpp",
        passportId: randomUUID(),
        presentationConfigurationId: configId,
        slug: "my-product",
      });
      const plain = original.toPlain();
      expect(plain.kind).toBe("open-dpp");
      expect(plain.passportId).toBe(original.passportId);
      expect(plain.uniqueProductIdentifierId).toBeNull();
      expect(plain.gs1DataAttributes).toBeNull();
      expect("primary" in plain).toBe(false);

      const restored = Permalink.fromPlain({
        ...plain,
        createdAt: plain.createdAt.toISOString(),
        updatedAt: plain.updatedAt.toISOString(),
      });
      expect(restored.kind).toBe("open-dpp");
      expect(restored.passportId).toBe(original.passportId);
      expect(restored.uniqueProductIdentifierId).toBeNull();
      expect(restored.gs1DataAttributes).toBeNull();
    });

    it("toPlain includes all fields and round-trips through fromPlain for gs1-link kind", () => {
      const gs1Attributes = gs1DataAttributesPlainFactory.build();
      const original = Permalink.create({
        kind: "gs1-link",
        passportId: randomUUID(),
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
      expect(restored.passportId).toBe(original.passportId);
      expect(restored.uniqueProductIdentifierId).toBe(upiId);
      expect(restored.gs1DataAttributes).toEqual(gs1Attributes);
    });

    it("fromPlain defaults kind to open-dpp on docs lacking kind", () => {
      const isoNow = new Date().toISOString();
      const restored = Permalink.fromPlain({
        id: randomUUID(),
        passportId: randomUUID(),
        slug: null,
        presentationConfigurationId: configId,
        createdAt: isoNow,
        updatedAt: isoNow,
      });
      expect(restored.kind).toBe("open-dpp");
      expect(restored.uniqueProductIdentifierId).toBeNull();
      expect(restored.gs1DataAttributes).toBeNull();
    });

    it("has no primary field on the domain object", () => {
      const permalink = Permalink.create(baseInput());
      expect("primary" in permalink).toBe(false);
      expect("withPrimary" in permalink).toBe(false);
    });
  });

  describe("withPresentationConfigurationId (config rebind)", () => {
    const makeOpenDpp = () =>
      Permalink.create({
        kind: "open-dpp",
        passportId: randomUUID(),
        presentationConfigurationId: randomUUID(),
        slug: "my-product",
      });

    it("rebinds to a new config and returns a new instance", () => {
      const original = makeOpenDpp();
      const newConfigId = randomUUID();
      const next = original.withPresentationConfigurationId(newConfigId);
      expect(next).not.toBe(original);
      expect(next.presentationConfigurationId).toBe(newConfigId);
      expect(next.passportId).toBe(original.passportId);
    });

    it("rebinds to null (falls back to standard view)", () => {
      const original = makeOpenDpp();
      const next = original.withPresentationConfigurationId(null);
      expect(next.presentationConfigurationId).toBeNull();
    });

    it("throws ValueError on a non-uuid config id", () => {
      const original = makeOpenDpp();
      expect(() => original.withPresentationConfigurationId("not-a-uuid")).toThrow(ValueError);
    });

    it("throws ValueError once published (config locked with the frozen URL)", () => {
      const frozen = makeOpenDpp().withPublishedUrl("https://passports.example.com/p/my-product");
      expect(() => frozen.withPresentationConfigurationId(randomUUID())).toThrow(ValueError);
    });

    it("is allowed on a gs1-link permalink pre-freeze (config override rebind)", () => {
      const original = Permalink.create({
        kind: "gs1-link",
        passportId: randomUUID(),
        uniqueProductIdentifierId: randomUUID(),
        presentationConfigurationId: null,
      });
      const configId = randomUUID();
      const next = original.withPresentationConfigurationId(configId);
      expect(next.presentationConfigurationId).toBe(configId);
    });
  });

  describe("gs1 data attribute mutators", () => {
    const upiId = randomUUID();

    const makeOpenDpp = () =>
      Permalink.create({
        kind: "open-dpp",
        passportId: randomUUID(),
        presentationConfigurationId: randomUUID(),
      });

    const makeGs1Link = () =>
      Permalink.create({
        kind: "gs1-link",
        passportId: randomUUID(),
        uniqueProductIdentifierId: upiId,
        presentationConfigurationId: null,
      });

    const makePublishedGs1Link = () =>
      makeGs1Link().withPublishedUrl("https://id.example.com/gs1/v1/01/04006381333931");

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
      const invalid: Record<string, string> = { "01": "04006381333931" };
      expect(() => original.withGs1DataAttributes(invalid)).toThrow(ValueError);
    });

    it("withGs1DataAttributes throws ValueError on an open-dpp permalink", () => {
      const original = makeOpenDpp();
      expect(() => original.withGs1DataAttributes(gs1DataAttributesPlainFactory.build())).toThrow(
        ValueError,
      );
    });

    it("withGs1DataAttributes throws ValueError once published", () => {
      const frozen = makePublishedGs1Link();
      expect(() => frozen.withGs1DataAttributes(gs1DataAttributesPlainFactory.build())).toThrow(
        ValueError,
      );
    });

    it("withGs1DataAttributes preserves id, slug, baseUrl, publishedUrl, kind, passportId, uniqueProductIdentifierId", () => {
      const original = makeGs1Link();
      const next = original.withGs1DataAttributes(gs1DataAttributesPlainFactory.build());
      expect(next.id).toBe(original.id);
      expect(next.slug).toBe(original.slug);
      expect(next.baseUrl).toBe(original.baseUrl);
      expect(next.publishedUrl).toBe(original.publishedUrl);
      expect(next.kind).toBe(original.kind);
      expect(next.passportId).toBe(original.passportId);
      expect(next.uniqueProductIdentifierId).toBe(original.uniqueProductIdentifierId);
    });
  });

  describe("copy() semantics", () => {
    const fullyPopulated = () =>
      Permalink.create({
        kind: "gs1-link",
        passportId: randomUUID(),
        uniqueProductIdentifierId: randomUUID(),
        presentationConfigurationId: randomUUID(),
        slug: "packed-product",
        baseUrl: "https://passports.example.com",
        gs1DataAttributes: gs1DataAttributesPlainFactory.build(),
        organizationId: randomUUID(),
      });

    it("preserves every field except the one overridden", () => {
      const original = fullyPopulated();
      const newConfigId = randomUUID();
      const next = original.withPresentationConfigurationId(newConfigId);

      expect(next).not.toBe(original);
      expect(next.presentationConfigurationId).toBe(newConfigId);
      expect(next.id).toBe(original.id);
      expect(next.slug).toBe(original.slug);
      expect(next.baseUrl).toBe(original.baseUrl);
      expect(next.publishedUrl).toBe(original.publishedUrl);
      expect(next.kind).toBe(original.kind);
      expect(next.passportId).toBe(original.passportId);
      expect(next.uniqueProductIdentifierId).toBe(original.uniqueProductIdentifierId);
      expect(next.gs1DataAttributes).toEqual(original.gs1DataAttributes);
      expect(next.organizationId).toBe(original.organizationId);
      expect(next.createdAt.getTime()).toBe(original.createdAt.getTime());
    });

    it("advances updatedAt", () => {
      const original = fullyPopulated();
      const next = original.withPresentationConfigurationId(randomUUID());
      expect(next.updatedAt).toBeInstanceOf(Date);
      expect(next.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());
    });

    it("does not mutate the receiver", () => {
      const original = fullyPopulated();
      const originalConfigId = original.presentationConfigurationId;
      const originalUpdatedAt = original.updatedAt.getTime();
      original.withPresentationConfigurationId(randomUUID());
      expect(original.presentationConfigurationId).toBe(originalConfigId);
      expect(original.updatedAt.getTime()).toBe(originalUpdatedAt);
    });
  });
});
