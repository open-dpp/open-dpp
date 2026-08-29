import { describe, expect, it, jest } from "@jest/globals";
import { EnvService } from "@open-dpp/env";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { InstanceSettingsService } from "../application/services/instance-settings.service";
import { InstanceSettings } from "../domain/instance-settings";
import { InstanceSettingsController } from "./instance-settings.controller";

describe("InstanceSettingsController", () => {
  const settings = InstanceSettings.create().withEnvOverrides({ mailEnabled: false });
  const controller = new InstanceSettingsController(
    { getSettings: jest.fn(async () => settings) } as unknown as InstanceSettingsService,
    { get: () => "https://dpp.example.com" } as unknown as EnvService,
  );

  it("tells anonymous callers whether mail is enabled", async () => {
    const dto = await controller.getPublicSettings(UserRole.ANONYMOUS);

    expect(dto.mailEnabled).toBe(false);
    expect(dto).not.toHaveProperty("organizationCreationEnabled");
  });

  it("includes the mailEnabled setting with its lock state for admins", async () => {
    const dto = await controller.getSettings();

    expect(dto.mailEnabled).toEqual({ value: false, locked: true });
  });
});
