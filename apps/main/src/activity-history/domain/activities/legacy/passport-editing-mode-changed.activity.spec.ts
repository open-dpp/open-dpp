import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PassportEditingMode } from "../../../../digital-product-document/domain/editing-mode";
import { registerChangeEventClasses } from "../../change-events/register-change-event-classes";
import { getActivityClass } from "../activity-registry";
import { ActivityTypes } from "../activity-types";
import { registerActivityClasses } from "../register-activity-classes";
import { PassportEditingModeChangedActivity } from "./passport-editing-mode-changed.activity";

describe("legacy PassportEditingModeChangedActivity", () => {
  const persisted = {
    header: {
      id: randomUUID(),
      aggregateId: randomUUID(),
      correlationId: randomUUID(),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      type: ActivityTypes.PassportEditingModeChanged,
      userId: randomUUID(),
      version: "1.0.0",
      exportVersion: "6.0",
    },
    payload: {
      changes: [
        {
          type: "PassportEditingModeChanged",
          oldValue: PassportEditingMode.DataOnly,
          newValue: PassportEditingMode.Full,
        },
      ],
    },
  };

  it("still deserializes an activity stored before the editing mode became derived", () => {
    registerChangeEventClasses();
    registerActivityClasses();

    const activity = getActivityClass(ActivityTypes.PassportEditingModeChanged).fromPlain(
      persisted,
    ) as PassportEditingModeChangedActivity;

    expect(activity).toBeInstanceOf(PassportEditingModeChangedActivity);
    expect(activity.header.id).toEqual(persisted.header.id);
    expect(activity.isNoop()).toBeFalsy();
    expect(activity.toPlain().payload).toEqual(persisted.payload);
  });
});
