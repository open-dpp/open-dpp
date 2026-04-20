import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { KeyTypes, PresentationComponentName, PresentationReferenceType } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { ZodError } from "zod";
import { PresentationConfiguration } from "./presentation-configuration";

describe("PresentationConfiguration", () => {
  const baseInput = () => ({
    organizationId: "org-1",
    referenceId: randomUUID(),
    referenceType: PresentationReferenceType.Template,
  });

  it("rejects empty organizationId in create() with ValueError", () => {
    expect(() =>
      PresentationConfiguration.create({
        ...baseInput(),
        organizationId: "",
      }),
    ).toThrow(ValueError);
  });

  it("rejects non-uuid referenceId in create() with ValueError carrying the field path", () => {
    try {
      PresentationConfiguration.create({
        ...baseInput(),
        referenceId: "not-a-uuid",
      });
      throw new Error("expected create() to throw ValueError");
    } catch (error) {
      expect(error).toBeInstanceOf(ValueError);
      expect((error as Error).message).toContain("referenceId");
    }
  });

  it("rejects invalid referenceType in create() with ValueError", () => {
    expect(() =>
      PresentationConfiguration.create({
        ...baseInput(),
        referenceType: "invalid" as never,
      }),
    ).toThrow(ValueError);
  });

  it("preserves the original ZodError as the ValueError cause", () => {
    try {
      PresentationConfiguration.create({
        ...baseInput(),
        organizationId: "",
      });
      throw new Error("expected create() to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ValueError);
      expect((error as Error).cause).toBeInstanceOf(ZodError);
    }
  });

  it("creates with empty maps by default", () => {
    const config = PresentationConfiguration.create(baseInput());

    expect(config.id).toBeTruthy();
    expect(config.organizationId).toBe("org-1");
    expect(config.referenceType).toBe(PresentationReferenceType.Template);
    expect(config.elementDesign.size).toBe(0);
    expect(config.defaultComponents.size).toBe(0);
    expect(config.createdAt).toBeInstanceOf(Date);
    expect(config.updatedAt).toBeInstanceOf(Date);
  });

  it("round-trips through toPlain/fromPlain", () => {
    const config = PresentationConfiguration.create({
      ...baseInput(),
      elementDesign: { "submodel-1.prop-1": PresentationComponentName.BigNumber },
      defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
    });

    const plain = config.toPlain();
    const restored = PresentationConfiguration.fromPlain(plain);

    expect(restored.id).toBe(config.id);
    expect(restored.organizationId).toBe(config.organizationId);
    expect(restored.referenceId).toBe(config.referenceId);
    expect(restored.referenceType).toBe(config.referenceType);
    expect(Object.fromEntries(restored.elementDesign)).toEqual({
      "submodel-1.prop-1": PresentationComponentName.BigNumber,
    });
    expect(Object.fromEntries(restored.defaultComponents)).toEqual({
      [KeyTypes.Property]: PresentationComponentName.BigNumber,
    });
  });

  it("fromPlain silently drops entries with unknown component names (backward-compatible load)", () => {
    const restored = PresentationConfiguration.fromPlain({
      id: randomUUID(),
      organizationId: "org-1",
      referenceId: randomUUID(),
      referenceType: PresentationReferenceType.Template,
      elementDesign: {
        "submodel-1.prop-1": "NotARealComponent",
        "submodel-1.prop-2": PresentationComponentName.BigNumber,
      },
      defaultComponents: {
        [KeyTypes.Property]: "AlsoGone",
        [KeyTypes.File]: PresentationComponentName.BigNumber,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(restored.elementDesign.get("submodel-1.prop-1")).toBeUndefined();
    expect(restored.elementDesign.get("submodel-1.prop-2")).toBe(
      PresentationComponentName.BigNumber,
    );
    expect(restored.defaultComponents.get(KeyTypes.Property)).toBeUndefined();
    expect(restored.defaultComponents.get(KeyTypes.File)).toBe(PresentationComponentName.BigNumber);
  });

  it("withElementDesign produces a new instance and bumps updatedAt", async () => {
    const config = PresentationConfiguration.create(baseInput());
    await new Promise((resolve) => setTimeout(resolve, 2));

    const next = config.withElementDesign("submodel-1.prop-1", PresentationComponentName.BigNumber);

    expect(next).not.toBe(config);
    expect(config.elementDesign.size).toBe(0);
    expect(next.elementDesign.get("submodel-1.prop-1")).toBe(PresentationComponentName.BigNumber);
    expect(next.updatedAt.getTime()).toBeGreaterThanOrEqual(config.updatedAt.getTime());
    expect(next.createdAt).toBe(config.createdAt);
  });

  it("withoutElementDesign returns the same instance when the key is absent", () => {
    const config = PresentationConfiguration.create(baseInput());

    expect(config.withoutElementDesign("missing")).toBe(config);
  });

  it("withoutElementDesign returns a new instance when the key is present", () => {
    const config = PresentationConfiguration.create({
      ...baseInput(),
      elementDesign: { "submodel-1.prop-1": PresentationComponentName.BigNumber },
    });

    const next = config.withoutElementDesign("submodel-1.prop-1");

    expect(next).not.toBe(config);
    expect(next.elementDesign.size).toBe(0);
    expect(config.elementDesign.size).toBe(1);
  });

  it("withDefaultComponent adds or overwrites per KeyType", () => {
    const config = PresentationConfiguration.create(baseInput())
      .withDefaultComponent(KeyTypes.Property, PresentationComponentName.BigNumber)
      .withDefaultComponent(KeyTypes.File, PresentationComponentName.BigNumber);

    expect(config.defaultComponents.get(KeyTypes.Property)).toBe(
      PresentationComponentName.BigNumber,
    );
    expect(config.defaultComponents.get(KeyTypes.File)).toBe(PresentationComponentName.BigNumber);
  });

  it("withoutDefaultComponent is a no-op when the key is absent", () => {
    const config = PresentationConfiguration.create(baseInput());

    expect(config.withoutDefaultComponent(KeyTypes.Property)).toBe(config);
  });
});
