import { randomUUID } from "node:crypto";
import { Environment } from "../../aas/domain/environment";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
} from "../../digital-product-document/domain/digital-product-document-status";
import { Template } from "./template";

describe("template", () => {
  it("should be published", () => {
    const passport = Template.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    });
    expect(passport.isPublished()).toBeFalsy();
    passport.publish();
    expect(passport.isPublished()).toBeTruthy();
  });

  it("should be archived", () => {
    const passport = Template.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    });
    expect(passport.isArchived()).toBeFalsy();
    passport.archive();
    expect(passport.isArchived()).toBeTruthy();
  });

  it("should be restored", () => {
    const passport = Template.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
      lastStatusChange: DigitalProductDocumentStatusChange.create({
        previousStatus: DigitalProductDocumentStatus.Draft,
        currentStatus: DigitalProductDocumentStatus.Archived,
      }),
    });
    expect(passport.isArchived()).toBeTruthy();
    passport.restore();
    expect(passport.isArchived()).toBeFalsy();
    expect(passport.isDraft()).toBeTruthy();
  });
});
