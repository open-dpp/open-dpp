import { Injectable } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { ValueError } from "@open-dpp/exception";
import { InstanceSettings, InstanceSettingsDbProps } from "../../domain/instance-settings";
import { InstanceSettingsRepository } from "../../infrastructure/adapters/instance-settings.repository";

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

  private validateUpdatesAgainstEnvironment(updates: Partial<InstanceSettingsDbProps>) {
    const settings = {
      signupEnabled: this.envService.get("OPEN_DPP_INSTANCE_SIGNUP_ENABLED"),
    };
    if (settings.signupEnabled !== undefined && updates.signupEnabled !== settings.signupEnabled) {
      throw new ValueError("Cannot override signupEnabled when OPEN_DPP_INSTANCE_SIGNUP_ENABLED is set");
    }
  }

  async updateSettings(
    updates: Partial<InstanceSettingsDbProps>,
  ): Promise<InstanceSettings> {
    this.validateUpdatesAgainstEnvironment(updates);

    const current = await this.getSettings();
    const updated = current.update(updates);
    const saved = await this.repository.save(updated);
    return this.applyEnvOverrides(saved);
  }

  private applyEnvOverrides(settings: InstanceSettings): InstanceSettings {
    const enforcedSignup = this.envService.get("OPEN_DPP_INSTANCE_SIGNUP_ENABLED");

    return settings.withEnvOverrides({
      signupEnabled: enforcedSignup,
    });
  }
}
