import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PassportEditingModeChangedActivity } from "./passport-editing-mode-changed.activity";
import { Passport } from "../../../passports/domain/passport";
import { PassportEditingMode } from "../../../digital-product-document/domain/editing-mode";
import { Environment } from "../../../aas/domain/environment";

describe("PassportEditingModeChangedActivity", () => {
  it("records the tracked change when passport editing mode changes", () => {
    const passport = Passport.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
      editingMode: PassportEditingMode.DataOnly,
    }).withTracking();
    passport.removeEditingRestrictions();

    const activity = PassportEditingModeChangedActivity.create({
      correlationId: randomUUID(),
      userId: randomUUID(),
      digitalProductDocumentId: passport.id,
      item: passport,
    });

    expect(activity.isNoop()).toBeFalsy();
    expect(activity.payload.changes).toHaveLength(1);
  });

  it("is a noop when nothing was tracked", () => {
    const passport = Passport.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    }).withTracking();

    const activity = PassportEditingModeChangedActivity.create({
      correlationId: randomUUID(),
      userId: randomUUID(),
      digitalProductDocumentId: passport.id,
      item: passport,
    });

    expect(activity.isNoop()).toBeTruthy();
    expect(activity.payload.changes).toHaveLength(0);
  });
});
