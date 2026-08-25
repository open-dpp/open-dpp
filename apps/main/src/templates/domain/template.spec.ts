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
});
