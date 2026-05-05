import { Injectable } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { InstanceSettings, InstanceSettingsDbProps } from "../../domain/instance-settings";
import { InstanceSettingsRepository } from "../../infrastructure/adapters/instance-settings.repository";
import { SignupEnabledSetting } from "../../domain/signup-enabled-setting";
import { OrganizationCreationEnabledSetting } from "../../domain/organization-creation-enabled-setting";

@Injectable()
export class InstanceSettingsService {
  constructor(
    private readonly repository: InstanceSettingsRepository,
    private readonly envService: EnvService,
  ) {}

  async getSettings(): Promise<InstanceSettings> {
    const existing = await this.repository.findOne();

    if (existing) {
      return this.applyEnvOverrides(existing);
    }

    const defaults = InstanceSettings.create({
      signupEnabled: {
        value: true,
      },
    });
    const saved = await this.repository.save(defaults);
    return this.applyEnvOverrides(saved);
  }

  async updateSettings(updates: Partial<InstanceSettingsDbProps>): Promise<InstanceSettings> {
    const current = await this.getSettings();
    const updated = current.update(updates);
    const saved = await this.repository.save(updated);
    return this.applyEnvOverrides(saved);
  }

  private applyEnvOverrides(settings: InstanceSettings): InstanceSettings {
    const enforcedSignup = this.envService.get(SignupEnabledSetting.ENV_NAME);
    const envOrganizationCreationEnabled = this.envService.get(
      OrganizationCreationEnabledSetting.ENV_NAME,
    );

    return settings.withEnvOverrides({
      signupEnabled: enforcedSignup,
      organizationCreationEnabled: envOrganizationCreationEnabled,
    });
  }
}
