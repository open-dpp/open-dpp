import { Injectable } from "@nestjs/common";
import { InstanceSettings, InstanceSettingsCreateProps } from "../../domain/instance-settings";
import { InstanceSettingsRepository } from "../../infrastructure/adapters/instance-settings.repository";

@Injectable()
export class InstanceSettingsService {
  constructor(
    private readonly repository: InstanceSettingsRepository,
  ) {}

  async getSettings(): Promise<InstanceSettings> {
    const existing = await this.repository.findOne();
    if (existing) {
      return existing;
    }
    const defaults = InstanceSettings.create();
    return this.repository.save(defaults);
  }

  async updateSettings(updates: Partial<InstanceSettingsCreateProps>): Promise<InstanceSettings> {
    const current = await this.getSettings();
    const updated = current.update(updates);
    return this.repository.save(updated);
  }
}
