import { randomUUID } from "node:crypto";
import { PassportEditingModeChangedActivity } from "./passport-editing-mode-changed.activity";
import { Template } from "../../../templates/domain/template";
import { Environment } from "../../../aas/domain/environment";

describe("PassportEditingModeChangedActivity", () => {
  it("records the tracked change when passport editing mode changes", () => {
    const template = Template.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    }).withTracking();
    template.restrictPassportEditingToData();

    const activity = PassportEditingModeChangedActivity.create({
      correlationId: randomUUID(),
      userId: randomUUID(),
      digitalProductDocumentId: template.id,
      item: template,
    });

    expect(activity.isNoop()).toBeFalsy();
    expect(activity.payload.changes).toHaveLength(1);
  });

  it("is a noop when nothing was tracked", () => {
    const template = Template.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    }).withTracking();

    const activity = PassportEditingModeChangedActivity.create({
      correlationId: randomUUID(),
      userId: randomUUID(),
      digitalProductDocumentId: template.id,
      item: template,
    });

    expect(activity.isNoop()).toBeTruthy();
    expect(activity.payload.changes).toHaveLength(0);
  });
});
