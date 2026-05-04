import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { KeyTypes } from "../aas/enums/key-types-enum";
import {
  PresentationComponentName,
  PresentationConfigurationCreateRequestSchema,
  PresentationConfigurationDtoSchema,
  PresentationConfigurationExportSchema,
  PresentationConfigurationPatchSchema,
  PresentationReferenceType,
} from "./presentation-configuration.dto";

const validBase = () => ({
  id: randomUUID(),
  organizationId: "org-1",
  referenceId: randomUUID(),
  referenceType: PresentationReferenceType.Template,
  label: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe("PresentationConfigurationDtoSchema (tolerant load)", () => {
  it("silently drops elementDesign entries with unknown component names", () => {
    const parsed = PresentationConfigurationDtoSchema.parse({
      ...validBase(),
      elementDesign: {
        "sm.p": "Ghost",
        "sm.q": PresentationComponentName.BigNumber,
      },
      defaultComponents: {},
    });

    expect(parsed.elementDesign).toEqual({ "sm.q": PresentationComponentName.BigNumber });
  });

  it("silently drops defaultComponents entries for unknown KeyTypes or unknown values", () => {
    const parsed = PresentationConfigurationDtoSchema.parse({
      ...validBase(),
      elementDesign: {},
      defaultComponents: {
        NotAKeyType: PresentationComponentName.BigNumber,
        [KeyTypes.Property]: "AlsoGone",
        [KeyTypes.File]: PresentationComponentName.BigNumber,
      },
    });

    expect(parsed.defaultComponents).toEqual({
      [KeyTypes.File]: PresentationComponentName.BigNumber,
    });
  });

  it("accepts empty maps via schema defaults", () => {
    const parsed = PresentationConfigurationDtoSchema.parse({
      ...validBase(),
    });

    expect(parsed.elementDesign).toEqual({});
    expect(parsed.defaultComponents).toEqual({});
  });
});

describe("PresentationConfigurationExportSchema (tolerant import)", () => {
  it("silently drops unknown entries", () => {
    const parsed = PresentationConfigurationExportSchema.parse({
      elementDesign: {
        keep: PresentationComponentName.BigNumber,
        drop: "LegacyTextField",
      },
      defaultComponents: {
        UnknownKeyType: PresentationComponentName.BigNumber,
        [KeyTypes.Property]: PresentationComponentName.BigNumber,
      },
    });

    expect(parsed.elementDesign).toEqual({ keep: PresentationComponentName.BigNumber });
    expect(parsed.defaultComponents).toEqual({
      [KeyTypes.Property]: PresentationComponentName.BigNumber,
    });
  });
});

describe("PresentationConfigurationPatchSchema (strict write)", () => {
  it("accepts valid component names and null-for-delete", () => {
    const parsed = PresentationConfigurationPatchSchema.parse({
      elementDesign: {
        "sm.set": PresentationComponentName.BigNumber,
        "sm.clear": null,
      },
      defaultComponents: {
        [KeyTypes.Property]: PresentationComponentName.BigNumber,
        [KeyTypes.File]: null,
      },
    });

    expect(parsed.elementDesign).toEqual({
      "sm.set": PresentationComponentName.BigNumber,
      "sm.clear": null,
    });
    expect(parsed.defaultComponents).toEqual({
      [KeyTypes.Property]: PresentationComponentName.BigNumber,
      [KeyTypes.File]: null,
    });
  });

  it("rejects unknown component names in elementDesign", () => {
    const result = PresentationConfigurationPatchSchema.safeParse({
      elementDesign: { "sm.p": "NotARealComponent" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown KeyType keys in defaultComponents", () => {
    const result = PresentationConfigurationPatchSchema.safeParse({
      defaultComponents: { NotAKeyType: PresentationComponentName.BigNumber },
    });
    expect(result.success).toBe(false);
  });

  it("accepts an empty patch body", () => {
    const result = PresentationConfigurationPatchSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({});
  });
});

describe("PresentationConfigurationDtoSchema label", () => {
  it("accepts null label", () => {
    const parsed = PresentationConfigurationDtoSchema.parse({
      ...validBase(),
      label: null,
    });
    expect(parsed.label).toBeNull();
  });

  it("accepts non-empty string label", () => {
    const parsed = PresentationConfigurationDtoSchema.parse({
      ...validBase(),
      label: "Variant A",
    });
    expect(parsed.label).toBe("Variant A");
  });

  it("rejects an empty string label", () => {
    const result = PresentationConfigurationDtoSchema.safeParse({
      ...validBase(),
      label: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("PresentationConfigurationCreateRequestSchema", () => {
  it("accepts a null label", () => {
    expect(
      PresentationConfigurationCreateRequestSchema.parse({ label: null }).label,
    ).toBeNull();
  });
  it("accepts a string label", () => {
    expect(
      PresentationConfigurationCreateRequestSchema.parse({ label: "v1" }).label,
    ).toBe("v1");
  });
  it("rejects an empty string label", () => {
    expect(
      PresentationConfigurationCreateRequestSchema.safeParse({ label: "" }).success,
    ).toBe(false);
  });
});
