import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Environment } from "../../aas/domain/environment";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
} from "../../digital-product-document/domain/digital-product-document-status";
import { PassportEditingMode } from "../../digital-product-document/domain/editing-mode";
import { Passport } from "./passport";

describe("passport", () => {
  it("should be published", () => {
    const passport = Passport.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    });
    expect(passport.isPublished()).toBeFalsy();
    passport.publish();
    expect(passport.isPublished()).toBeTruthy();
  });

  it("should be archived", () => {
    const passport = Passport.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    });
    expect(passport.isArchived()).toBeFalsy();
    passport.archive();
    expect(passport.isArchived()).toBeTruthy();
  });

  it("should be restored", () => {
    const passport = Passport.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
      lastStatusChange: DigitalProductDocumentStatusChange.create({
        previousStatus: DigitalProductDocumentStatus.Draft,
        currentStatus: DigitalProductDocumentStatus.Archived,
      }),
    });
    expect(passport.isArchived()).toBeTruthy();
    passport.restore();
    expect(passport.isDraft()).toBeTruthy();
  });

  it("should remove editing restrictions", () => {
    const passport = Passport.create({
      organizationId: randomUUID(),
      templateId: randomUUID(),
      environment: Environment.create({}),
      editingMode: PassportEditingMode.DataOnly,
    });
    expect(passport.getEditingMode()).toEqual(PassportEditingMode.DataOnly);
    passport.removeEditingRestrictions();
    expect(passport.getEditingMode()).toEqual(PassportEditingMode.Full);
  });

  it("should not remove editing restrictions from a fully-editable passport", () => {
    const passport = Passport.create({
      organizationId: randomUUID(),
      templateId: randomUUID(),
      environment: Environment.create({}),
    });
    expect(() => passport.removeEditingRestrictions()).toThrow(
      "This passport's editing is not restricted.",
    );
  });

  it("should only allow data edits when editing is restricted to data", () => {
    const passport = Passport.create({
      organizationId: randomUUID(),
      templateId: randomUUID(),
      environment: Environment.create({}),
      editingMode: PassportEditingMode.DataOnly,
    });
    expect(() => passport.assertStructureEditable()).toThrow(
      `Passport ${passport.id} editing is restricted to data; structural changes are not allowed`,
    );
    expect(() => passport.assertDataEditable()).not.toThrow();
  });

  it("should allow structure and data edits when fully editable", () => {
    const passport = Passport.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    });
    expect(() => passport.assertStructureEditable()).not.toThrow();
    expect(() => passport.assertDataEditable()).not.toThrow();
  });

  it("should not allow any edit of an archived passport", () => {
    const passport = Passport.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
      lastStatusChange: DigitalProductDocumentStatusChange.create({
        previousStatus: DigitalProductDocumentStatus.Draft,
        currentStatus: DigitalProductDocumentStatus.Archived,
      }),
    });
    const message = "Cannot modify an archived digital product document";
    expect(() => passport.assertStructureEditable()).toThrow(message);
    expect(() => passport.assertDataEditable()).toThrow(message);
  });
});
