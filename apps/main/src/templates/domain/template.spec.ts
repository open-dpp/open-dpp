import { randomUUID } from "node:crypto";
import { Environment } from "../../aas/domain/environment";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
} from "../../digital-product-document/domain/digital-product-document-status";
import { Template } from "./template";

describe("template", () => {
  it("should be published", () => {
    const template = Template.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    });
    expect(template.isPublished()).toBeFalsy();
    const published = template.publish();
    expect(published).not.toBe(template);
    expect(template.isPublished()).toBeFalsy();
    expect(published.isPublished()).toBeTruthy();
  });

  it("should be archived", () => {
    const template = Template.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    });
    expect(template.isArchived()).toBeFalsy();
    const archived = template.archive();
    expect(archived).not.toBe(template);
    expect(template.isArchived()).toBeFalsy();
    expect(archived.isArchived()).toBeTruthy();
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
    const restored = template.restore();
    expect(restored).not.toBe(template);
    expect(template.isArchived()).toBeTruthy();
    expect(restored.isArchived()).toBeFalsy();
    expect(restored.isDraft()).toBeTruthy();
  });
});
