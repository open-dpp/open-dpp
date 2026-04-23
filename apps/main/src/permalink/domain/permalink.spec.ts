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
});
