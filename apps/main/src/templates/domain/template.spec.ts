import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Environment } from "../../aas/domain/environment";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
} from "../../digital-product-document/domain/digital-product-document-status";
import { EditingMode, PassportEditingMode } from "../../digital-product-document/domain/editing-mode";
import { Template } from "./template";

describe("template", () => {
  it("should be published", () => {
    const template = Template.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    });
    expect(template.isPublished()).toBeFalsy();
    template.publish();
    expect(template.isPublished()).toBeTruthy();
  });

  it("should be archived", () => {
    const template = Template.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    });
    expect(template.isArchived()).toBeFalsy();
    template.archive();
    expect(template.isArchived()).toBeTruthy();
  });

  it("should be restored", () => {
    const template = Template.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
      lastStatusChange: DigitalProductDocumentStatusChange.create({
        previousStatus: DigitalProductDocumentStatus.Draft,
        currentStatus: DigitalProductDocumentStatus.Archived,
      }),
    });
    expect(template.isArchived()).toBeTruthy();
    template.restore();
    expect(template.isDraft()).toBeTruthy();
  });

  it("should restrict passport editing to data", () => {
    const template = Template.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    });
    expect(template.getPassportEditingMode()).toEqual(PassportEditingMode.Full);
    template.restrictPassportEditingToData();
    expect(template.getPassportEditingMode()).toEqual(PassportEditingMode.DataOnly);
  });

  it("should not restrict passport editing twice", () => {
    const template = Template.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
      passportEditingMode: PassportEditingMode.DataOnly,
    });
    expect(() => template.restrictPassportEditingToData()).toThrow(
      "Passport editing is already restricted to data for this template.",
    );
  });

  describe("editing mode", () => {
    function createTemplate(status?: DigitalProductDocumentStatusChange) {
      return Template.create({
        organizationId: randomUUID(),
        environment: Environment.create({}),
        lastStatusChange: status,
      });
    }

    it("is Full and fully editable while a draft", () => {
      const template = createTemplate();
      expect(template.getEditingMode()).toEqual(EditingMode.Full);
      expect(() => template.assertStructureEditable()).not.toThrow();
      expect(() => template.assertDataEditable()).not.toThrow();
    });

    it("is ReadOnly once published", () => {
      const template = createTemplate();
      template.publish();
      expect(template.getEditingMode()).toEqual(EditingMode.ReadOnly);
      expect(() => template.assertStructureEditable()).toThrow(
        `Template ${template.id} is read-only; changes are not allowed`,
      );
      expect(() => template.assertDataEditable()).toThrow(
        `Template ${template.id} is read-only; changes are not allowed`,
      );
    });

    it("is ReadOnly when archived, also if it was archived from draft", () => {
      const template = createTemplate();
      template.archive();
      expect(template.getEditingMode()).toEqual(EditingMode.ReadOnly);
    });

    it("is editable again when restored to draft and read-only when restored to published", () => {
      const fromDraft = createTemplate();
      fromDraft.archive();
      fromDraft.restore();
      expect(fromDraft.getEditingMode()).toEqual(EditingMode.Full);

      const fromPublished = createTemplate();
      fromPublished.publish();
      fromPublished.archive();
      fromPublished.restore();
      expect(fromPublished.getEditingMode()).toEqual(EditingMode.ReadOnly);
    });
  });
});
