import { describe, expect, it } from "vitest";
import { KeyTypes, PresentationComponentName, PresentationReferenceType } from "@open-dpp/dto";
import type { PresentationConfigurationDto } from "@open-dpp/dto";
import { resolveComponent } from "./presentation-config";

function config(partial: Partial<PresentationConfigurationDto> = {}): PresentationConfigurationDto {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    organizationId: "org-1",
    referenceId: "00000000-0000-4000-8000-000000000001",
    referenceType: PresentationReferenceType.Template,
    elementDesign: {},
    defaultComponents: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

describe("resolveComponent", () => {
  it("returns undefined when config is null", () => {
    expect(resolveComponent(null, { path: "sm.p", modelType: "Property" })).toBeUndefined();
  });

  it("returns undefined when config is undefined", () => {
    expect(resolveComponent(undefined, { path: "sm.p", modelType: "Property" })).toBeUndefined();
  });

  it("prefers an elementDesign entry matching the element path", () => {
    const cfg = config({
      elementDesign: { "sm.p": PresentationComponentName.BigNumber },
      defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
    });

    expect(resolveComponent(cfg, { path: "sm.p", modelType: "Property" })).toBe(
      PresentationComponentName.BigNumber,
    );
  });

  it("falls back to defaultComponents when the path is not configured", () => {
    const cfg = config({
      defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
    });

    expect(resolveComponent(cfg, { path: "sm.other", modelType: "Property" })).toBe(
      PresentationComponentName.BigNumber,
    );
  });

  it("returns undefined when neither path nor modelType is configured", () => {
    const cfg = config({});
    expect(resolveComponent(cfg, { path: "sm.p", modelType: "File" })).toBeUndefined();
  });

  it("matches a deeply nested path (SEC inside SEC inside Submodel)", () => {
    const cfg = config({
      elementDesign: {
        "Metrics.Dimensions.weight": PresentationComponentName.BigNumber,
      },
    });

    expect(
      resolveComponent(cfg, { path: "Metrics.Dimensions.weight", modelType: "Property" }),
    ).toBe(PresentationComponentName.BigNumber);

    // A sibling path at the same depth with no override falls through to default.
    expect(
      resolveComponent(cfg, { path: "Metrics.Dimensions.height", modelType: "Property" }),
    ).toBeUndefined();
  });
});
