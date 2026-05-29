import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import {
  KeyTypes,
  PermissionKind,
  Permissions,
  PresentationComponentName,
  PresentationReferenceType,
} from "@open-dpp/dto";
import { ForbiddenError, ValueError } from "@open-dpp/exception";
import { ZodError } from "zod";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { Permission } from "../../aas/domain/security/permission";
import { Security } from "../../aas/domain/security/security";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
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
    expect(next.updatedAt.getTime()).toBeGreaterThan(config.updatedAt.getTime());
    expect(next.createdAt).toBe(config.createdAt);
  });

  it("withoutElementDesign returns the same instance when the key is absent", () => {
    const config = PresentationConfiguration.create(baseInput());

    expect(config.withoutElementDesign("missing")).toBe(config);
  });

  it("withElementDesign returns the same instance when the value is unchanged", () => {
    const config = PresentationConfiguration.create({
      ...baseInput(),
      elementDesign: { "submodel-1.prop-1": PresentationComponentName.BigNumber },
    });

    expect(config.withElementDesign("submodel-1.prop-1", PresentationComponentName.BigNumber)).toBe(
      config,
    );
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

  it("withDefaultComponent returns the same instance when the value is unchanged", () => {
    const config = PresentationConfiguration.create({
      ...baseInput(),
      defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
    });

    expect(
      config.withDefaultComponent(KeyTypes.Property, PresentationComponentName.BigNumber),
    ).toBe(config);
  });
});

describe("PresentationConfiguration label", () => {
  it("defaults label to null when not provided", () => {
    const c = PresentationConfiguration.createForPassport({
      organizationId: "org-1",
      referenceId: randomUUID(),
    });
    expect(c.label).toBeNull();
  });

  it("preserves an explicit label", () => {
    const c = PresentationConfiguration.create({
      organizationId: "org-1",
      referenceId: randomUUID(),
      referenceType: "passport",
      label: "Variant A",
    });
    expect(c.label).toBe("Variant A");
  });

  it("withLabel returns a new instance with updated label and updatedAt", async () => {
    const c = PresentationConfiguration.createForPassport({
      organizationId: "org-1",
      referenceId: randomUUID(),
    });
    await new Promise((resolve) => setTimeout(resolve, 2));
    const renamed = c.withLabel("Variant A");
    expect(renamed).not.toBe(c);
    expect(renamed.label).toBe("Variant A");
    expect(renamed.id).toBe(c.id);
    expect(renamed.updatedAt.getTime()).toBeGreaterThan(c.updatedAt.getTime());
  });

  it("withLabel(null) clears an existing label and returns a new instance", () => {
    const c = PresentationConfiguration.create({
      organizationId: "org-1",
      referenceId: randomUUID(),
      referenceType: "passport",
      label: "Variant A",
    });
    const cleared = c.withLabel(null);
    expect(cleared).not.toBe(c);
    expect(cleared.label).toBeNull();
    expect(cleared.id).toBe(c.id);
  });

  it("withLabel returns the same instance when label is unchanged", () => {
    const c = PresentationConfiguration.create({
      organizationId: "org-1",
      referenceId: randomUUID(),
      referenceType: "passport",
      label: "Variant A",
    });
    expect(c.withLabel("Variant A")).toBe(c);
  });
});

describe("PresentationConfiguration.withPatch", () => {
  const baseInput = () => ({
    organizationId: "org-1",
    referenceId: randomUUID(),
    referenceType: PresentationReferenceType.Template,
  });

  it("applies elementDesign additions", () => {
    const config = PresentationConfiguration.create(baseInput());
    const next = config.withPatch({
      elementDesign: { "sm.prop": PresentationComponentName.BigNumber },
    });
    expect(next).not.toBe(config);
    expect(next.elementDesign.get("sm.prop")).toBe(PresentationComponentName.BigNumber);
  });

  it("removes elementDesign entry when value is null", () => {
    const config = PresentationConfiguration.create({
      ...baseInput(),
      elementDesign: { "sm.prop": PresentationComponentName.BigNumber },
    });
    const next = config.withPatch({ elementDesign: { "sm.prop": null } });
    expect(next).not.toBe(config);
    expect(next.elementDesign.has("sm.prop")).toBe(false);
  });

  it("applies defaultComponents additions", () => {
    const config = PresentationConfiguration.create(baseInput());
    const next = config.withPatch({
      defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
    });
    expect(next).not.toBe(config);
    expect(next.defaultComponents.get(KeyTypes.Property)).toBe(PresentationComponentName.BigNumber);
  });

  it("removes defaultComponents entry when value is null", () => {
    const config = PresentationConfiguration.create({
      ...baseInput(),
      defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
    });
    const next = config.withPatch({
      defaultComponents: { [KeyTypes.Property]: null },
    });
    expect(next).not.toBe(config);
    expect(next.defaultComponents.has(KeyTypes.Property)).toBe(false);
  });

  it("returns the same instance when patch makes no observable change", () => {
    const config = PresentationConfiguration.create(baseInput());
    const same = config.withPatch({ elementDesign: {}, defaultComponents: {} });
    expect(same).toBe(config);
  });

  it("applies both elementDesign and defaultComponents in a single patch", () => {
    const config = PresentationConfiguration.create(baseInput());
    const next = config.withPatch({
      elementDesign: { "sm.prop": PresentationComponentName.BigNumber },
      defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
    });
    expect(next).not.toBe(config);
    expect(next.elementDesign.get("sm.prop")).toBe(PresentationComponentName.BigNumber);
    expect(next.defaultComponents.get(KeyTypes.Property)).toBe(PresentationComponentName.BigNumber);
  });

  it("returns the same instance when patch is empty (no keys provided)", () => {
    const config = PresentationConfiguration.create(baseInput());
    const same = config.withPatch({});
    expect(same).toBe(config);
  });
});

describe("PresentationConfiguration.withPatch permission checks", () => {
  const baseInput = () => ({
    organizationId: "org-1",
    referenceId: randomUUID(),
    referenceType: PresentationReferenceType.Template,
  });

  const memberSubject = SubjectAttributes.create({
    userRole: UserRole.USER,
    memberRole: MemberRole.MEMBER,
  });
  const anonymousSubject = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

  function buildAbilities() {
    const security = Security.create({});
    const readPerm = Permission.create({
      permission: Permissions.Read,
      kindOfPermission: PermissionKind.Allow,
    });
    const editPerm = Permission.create({
      permission: Permissions.Edit,
      kindOfPermission: PermissionKind.Allow,
    });
    security.addPolicy(memberSubject, IdShortPath.create({ path: "Pub" }), [readPerm, editPerm]);
    security.addPolicy(memberSubject, IdShortPath.create({ path: "Secret" }), [readPerm]);
    return {
      memberAbility: security.defineAbilityForSubject(memberSubject),
      anonymousAbility: security.defineAbilityForSubject(anonymousSubject),
    };
  }

  it("allows edits to paths the subject can edit (no ability = no check)", () => {
    const config = PresentationConfiguration.create(baseInput());
    const next = config.withPatch({
      elementDesign: { Secret: PresentationComponentName.BigNumber },
    });
    expect(next.elementDesign.get("Secret")).toBe(PresentationComponentName.BigNumber);
  });

  it("allows edits to paths the subject has edit permission for", () => {
    const { memberAbility } = buildAbilities();
    const config = PresentationConfiguration.create(baseInput());
    const next = config.withPatch(
      { elementDesign: { Pub: PresentationComponentName.BigNumber } },
      memberAbility,
    );
    expect(next.elementDesign.get("Pub")).toBe(PresentationComponentName.BigNumber);
  });

  it("throws ForbiddenError when subject has only read permission for a path", () => {
    const { memberAbility } = buildAbilities();
    const config = PresentationConfiguration.create(baseInput());
    expect(() =>
      config.withPatch(
        { elementDesign: { Secret: PresentationComponentName.BigNumber } },
        memberAbility,
      ),
    ).toThrow(ForbiddenError);
  });

  it("throws ForbiddenError atomically when any path in the patch is denied", () => {
    const { memberAbility } = buildAbilities();
    const config = PresentationConfiguration.create(baseInput());
    expect(() =>
      config.withPatch(
        {
          elementDesign: {
            Pub: PresentationComponentName.BigNumber,
            Secret: PresentationComponentName.BigNumber,
          },
        },
        memberAbility,
      ),
    ).toThrow(ForbiddenError);
  });

  it("does not apply any changes when ForbiddenError is thrown (atomicity)", () => {
    const { memberAbility } = buildAbilities();
    const config = PresentationConfiguration.create(baseInput());
    let caught: Error | undefined;
    try {
      config.withPatch(
        {
          elementDesign: {
            Pub: PresentationComponentName.BigNumber,
            Secret: PresentationComponentName.BigNumber,
          },
        },
        memberAbility,
      );
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).toBeInstanceOf(ForbiddenError);
    // original config should be unchanged
    expect(config.elementDesign.size).toBe(0);
  });

  it("throws ForbiddenError for anonymous subject with no edit permissions", () => {
    const { anonymousAbility } = buildAbilities();
    const config = PresentationConfiguration.create(baseInput());
    expect(() =>
      config.withPatch(
        { elementDesign: { Pub: PresentationComponentName.BigNumber } },
        anonymousAbility,
      ),
    ).toThrow(ForbiddenError);
  });

  it("allows defaultComponents-only patches without per-path checks even with ability", () => {
    const { memberAbility } = buildAbilities();
    const config = PresentationConfiguration.create(baseInput());
    const next = config.withPatch(
      { defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber } },
      memberAbility,
    );
    expect(next.defaultComponents.get(KeyTypes.Property)).toBe(PresentationComponentName.BigNumber);
  });
});
