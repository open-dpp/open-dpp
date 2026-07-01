import { describe, expect, it } from "vitest";
import enUS from "./en-US.json";
import deDE from "./de-DE.json";

describe("uniqueProductIdentifiers i18n keys", () => {
  it("en-US has a non-empty uniqueProductIdentifiers object", () => {
    expect(enUS).toHaveProperty("uniqueProductIdentifiers");
    expect(typeof (enUS as Record<string, unknown>)["uniqueProductIdentifiers"]).toBe("object");
  });

  it("en-US has the required label key", () => {
    const upi = (enUS as Record<string, Record<string, unknown>>)["uniqueProductIdentifiers"]!;
    expect(upi).toHaveProperty("label");
    expect(typeof upi["label"]).toBe("string");
    expect((upi["label"] as string).length).toBeGreaterThan(0);
  });

  it("en-US has all required list keys", () => {
    const upi = (enUS as Record<string, Record<string, unknown>>)["uniqueProductIdentifiers"]!;
    const list = upi["list"] as Record<string, string>;
    expect(list).toHaveProperty("type");
    expect(list).toHaveProperty("gtin");
    expect(list).toHaveProperty("batch");
    expect(list).toHaveProperty("serial");
    expect(list).toHaveProperty("reference");
    expect(list).toHaveProperty("systemReadOnly");
    expect(list).toHaveProperty("empty");
  });

  it("en-US has all required create keys", () => {
    const upi = (enUS as Record<string, Record<string, unknown>>)["uniqueProductIdentifiers"]!;
    const create = upi["create"] as Record<string, string>;
    expect(create).toHaveProperty("title");
    expect(create).toHaveProperty("description");
    expect(create).toHaveProperty("gtin");
    expect(create).toHaveProperty("batch");
    expect(create).toHaveProperty("serial");
    expect(create).toHaveProperty("submit");
    expect(create).toHaveProperty("passportNotDraft");
    expect(create).toHaveProperty("gtinInvalid");
    expect(create).toHaveProperty("componentInvalid");
    expect(create).toHaveProperty("duplicate");
  });

  it("en-US has all required gs1LinkPrompt keys", () => {
    const upi = (enUS as Record<string, Record<string, unknown>>)["uniqueProductIdentifiers"]!;
    const gs1LinkPrompt = upi["gs1LinkPrompt"] as Record<string, string>;
    expect(gs1LinkPrompt).toHaveProperty("title");
    expect(gs1LinkPrompt).toHaveProperty("question");
    expect(gs1LinkPrompt).toHaveProperty("addLink");
    expect(gs1LinkPrompt).toHaveProperty("skip");
  });

  it("de-DE has the same uniqueProductIdentifiers keys as en-US (parity)", () => {
    expect(deDE).toHaveProperty("uniqueProductIdentifiers");
    const upiEn = (enUS as Record<string, Record<string, unknown>>)["uniqueProductIdentifiers"]!;
    const upiDe = (deDE as Record<string, Record<string, unknown>>)["uniqueProductIdentifiers"]!;

    // label
    expect(upiDe).toHaveProperty("label");

    // list keys
    const listEn = upiEn["list"] as Record<string, string>;
    const listDe = upiDe["list"] as Record<string, string>;
    for (const key of Object.keys(listEn)) {
      expect(listDe).toHaveProperty(key);
    }

    // create keys
    const createEn = upiEn["create"] as Record<string, string>;
    const createDe = upiDe["create"] as Record<string, string>;
    for (const key of Object.keys(createEn)) {
      expect(createDe).toHaveProperty(key);
    }

    // gs1LinkPrompt keys
    const promptEn = upiEn["gs1LinkPrompt"] as Record<string, string>;
    const promptDe = upiDe["gs1LinkPrompt"] as Record<string, string>;
    for (const key of Object.keys(promptEn)) {
      expect(promptDe).toHaveProperty(key);
    }
  });

  it("de-DE has no extra uniqueProductIdentifiers keys that are missing from en-US", () => {
    const upiEn = (enUS as Record<string, Record<string, unknown>>)["uniqueProductIdentifiers"]!;
    const upiDe = (deDE as Record<string, Record<string, unknown>>)["uniqueProductIdentifiers"]!;

    const listDe = upiDe["list"] as Record<string, string>;
    const listEn = upiEn["list"] as Record<string, string>;
    for (const key of Object.keys(listDe)) {
      expect(listEn).toHaveProperty(key);
    }

    const createDe = upiDe["create"] as Record<string, string>;
    const createEn = upiEn["create"] as Record<string, string>;
    for (const key of Object.keys(createDe)) {
      expect(createEn).toHaveProperty(key);
    }

    const promptDe = upiDe["gs1LinkPrompt"] as Record<string, string>;
    const promptEn = upiEn["gs1LinkPrompt"] as Record<string, string>;
    for (const key of Object.keys(promptDe)) {
      expect(promptEn).toHaveProperty(key);
    }
  });
});
