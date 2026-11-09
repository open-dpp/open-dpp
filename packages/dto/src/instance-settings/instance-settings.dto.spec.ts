import { describe, expect, it } from "vitest";
import { BOOLEAN_INSTANCE_SETTING_KEYS, InstanceSettingsDtoSchema } from "./instance-settings.dto";

describe("BOOLEAN_INSTANCE_SETTING_KEYS", () => {
  it("lists the boolean settings of the admin DTO in schema order", () => {
    expect(BOOLEAN_INSTANCE_SETTING_KEYS).toEqual([
      "signupEnabled",
      "organizationCreationEnabled",
      "mailEnabled",
    ]);
  });

  it("names only keys the admin DTO carries", () => {
    for (const key of BOOLEAN_INSTANCE_SETTING_KEYS) {
      expect(InstanceSettingsDtoSchema.shape).toHaveProperty(key);
    }
  });
});
