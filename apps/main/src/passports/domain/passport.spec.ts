import { randomUUID } from "node:crypto";
import { Environment } from "../../aas/domain/environment";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
} from "../../digital-product-document/domain/digital-product-document-status";
import { Passport } from "./passport";

describe("passport", () => {
  it("should be published", () => {
    const passport = Passport.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    });
    expect(passport.isPublished()).toBeFalsy();
    const published = passport.publish();
    expect(published).not.toBe(passport);
    expect(passport.isPublished()).toBeFalsy();
    expect(published.isPublished()).toBeTruthy();
  });

  it("should be archived", () => {
    const passport = Passport.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    });
    expect(passport.isArchived()).toBeFalsy();
    const archived = passport.archive();
    expect(archived).not.toBe(passport);
    expect(passport.isArchived()).toBeFalsy();
    expect(archived.isArchived()).toBeTruthy();
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
    const restored = passport.restore();
    expect(restored).not.toBe(passport);
    expect(passport.isArchived()).toBeTruthy();
    expect(restored.isArchived()).toBeFalsy();
    expect(restored.isDraft()).toBeTruthy();
  });
});
