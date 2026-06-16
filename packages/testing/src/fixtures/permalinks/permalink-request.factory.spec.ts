import { randomUUID } from "node:crypto";
import {
  PermalinkCreateRequestSchema,
  PermalinkUpdateRequestSchema,
} from "@open-dpp/dto";
import {
  permalinkCreateRequestPlainFactory,
  permalinkGs1LinkCreateRequestPlainFactory,
  permalinkUpdateRequestPlainFactory,
} from "./permalink-request.factory";

describe("permalinkCreateRequestPlainFactory (presentation)", () => {
  it("produces an object that parses against PermalinkCreateRequestSchema (presentation variant)", () => {
    const result = permalinkCreateRequestPlainFactory.build();
    expect(() => PermalinkCreateRequestSchema.parse(result)).not.toThrow();
  });

  it("defaults to kind='presentation'", () => {
    const result = permalinkCreateRequestPlainFactory.build();
    expect(result.kind).toBe("presentation");
  });

  it("has a non-null presentationConfigurationId that is a UUID", () => {
    const result = permalinkCreateRequestPlainFactory.build();
    expect(typeof result.presentationConfigurationId).toBe("string");
    expect(result.presentationConfigurationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("accepts a custom presentationConfigurationId override", () => {
    const configId = randomUUID();
    const result = permalinkCreateRequestPlainFactory.build({
      presentationConfigurationId: configId,
    });
    expect(result.presentationConfigurationId).toBe(configId);
  });

  it("two consecutive builds produce distinct presentationConfigurationId values", () => {
    const a = permalinkCreateRequestPlainFactory.build();
    const b = permalinkCreateRequestPlainFactory.build();
    expect(a.presentationConfigurationId).not.toBe(b.presentationConfigurationId);
  });
});

describe("permalinkGs1LinkCreateRequestPlainFactory (gs1-link)", () => {
  it("produces an object that parses against PermalinkCreateRequestSchema (gs1-link variant)", () => {
    const result = permalinkGs1LinkCreateRequestPlainFactory.build();
    expect(() => PermalinkCreateRequestSchema.parse(result)).not.toThrow();
  });

  it("defaults to kind='gs1-link'", () => {
    const result = permalinkGs1LinkCreateRequestPlainFactory.build();
    expect(result.kind).toBe("gs1-link");
  });

  it("has a uniqueProductIdentifierId that is a UUID", () => {
    const result = permalinkGs1LinkCreateRequestPlainFactory.build();
    expect(typeof result.uniqueProductIdentifierId).toBe("string");
    expect(result.uniqueProductIdentifierId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("includes gs1DataAttributes by default (from the data-attributes factory)", () => {
    const result = permalinkGs1LinkCreateRequestPlainFactory.build();
    expect(result.gs1DataAttributes).not.toBeNull();
    expect(typeof result.gs1DataAttributes).toBe("object");
    expect(Object.keys(result.gs1DataAttributes!).length).toBeGreaterThan(0);
  });

  it("includes a gs1ResolverBase by default", () => {
    const result = permalinkGs1LinkCreateRequestPlainFactory.build();
    expect(typeof result.gs1ResolverBase).toBe("string");
    expect(result.gs1ResolverBase).toBeTruthy();
  });

  it("accepts a custom uniqueProductIdentifierId", () => {
    const upiId = randomUUID();
    const result = permalinkGs1LinkCreateRequestPlainFactory.build({
      uniqueProductIdentifierId: upiId,
    });
    expect(result.uniqueProductIdentifierId).toBe(upiId);
  });

  it("accepts a custom presentationConfigurationId (optional on gs1-link)", () => {
    const configId = randomUUID();
    const result = permalinkGs1LinkCreateRequestPlainFactory.build({
      presentationConfigurationId: configId,
    });
    expect(result.presentationConfigurationId).toBe(configId);
    expect(() => PermalinkCreateRequestSchema.parse(result)).not.toThrow();
  });

  it("accepts custom gs1DataAttributes override", () => {
    const attrs = { "3103": "000189" };
    const result = permalinkGs1LinkCreateRequestPlainFactory.build({
      gs1DataAttributes: attrs,
    });
    expect(result.gs1DataAttributes).toEqual({ "3103": "000189" });
    expect(() => PermalinkCreateRequestSchema.parse(result)).not.toThrow();
  });

  it("two consecutive builds produce distinct uniqueProductIdentifierId values", () => {
    const a = permalinkGs1LinkCreateRequestPlainFactory.build();
    const b = permalinkGs1LinkCreateRequestPlainFactory.build();
    expect(a.uniqueProductIdentifierId).not.toBe(b.uniqueProductIdentifierId);
  });
});

describe("permalinkUpdateRequestPlainFactory", () => {
  it("produces an object that parses against PermalinkUpdateRequestSchema", () => {
    const result = permalinkUpdateRequestPlainFactory.build();
    expect(() => PermalinkUpdateRequestSchema.parse(result)).not.toThrow();
  });

  it("does not include a 'kind' field", () => {
    const result = permalinkUpdateRequestPlainFactory.build();
    expect("kind" in result).toBe(false);
  });

  it("accepts primary:true override", () => {
    const result = permalinkUpdateRequestPlainFactory.build({ primary: true });
    expect(result.primary).toBe(true);
    expect(() => PermalinkUpdateRequestSchema.parse(result)).not.toThrow();
  });

  it("accepts gs1ResolverBase override", () => {
    const result = permalinkUpdateRequestPlainFactory.build({
      gs1ResolverBase: "https://id.acme.com",
    });
    expect(result.gs1ResolverBase).toBe("https://id.acme.com");
    expect(() => PermalinkUpdateRequestSchema.parse(result)).not.toThrow();
  });

  it("accepts gs1DataAttributes override", () => {
    const result = permalinkUpdateRequestPlainFactory.build({
      gs1DataAttributes: { "17": "251231" },
    });
    expect(result.gs1DataAttributes).toEqual({ "17": "251231" });
    expect(() => PermalinkUpdateRequestSchema.parse(result)).not.toThrow();
  });

  it("accepts presentationConfigurationId override", () => {
    const configId = randomUUID();
    const result = permalinkUpdateRequestPlainFactory.build({
      presentationConfigurationId: configId,
    });
    expect(result.presentationConfigurationId).toBe(configId);
    expect(() => PermalinkUpdateRequestSchema.parse(result)).not.toThrow();
  });
});
