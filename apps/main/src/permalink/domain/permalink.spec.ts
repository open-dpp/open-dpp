import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { ZodError } from "zod";
import { Permalink } from "./permalink";

describe("Permalink", () => {
  const baseInput = () => ({
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
});
