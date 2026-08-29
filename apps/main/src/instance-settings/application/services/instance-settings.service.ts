import { Injectable } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { InstanceSettings, InstanceSettingsDbProps } from "../../domain/instance-settings";
import { InstanceSettingsRepository } from "../../infrastructure/adapters/instance-settings.repository";
import { SignupEnabledSetting } from "../../domain/signup-enabled-setting";
import { OrganizationCreationEnabledSetting } from "../../domain/organization-creation-enabled-setting";
import { PermalinkBaseUrlSetting } from "../../domain/permalink-base-url-setting";
import { MailEnabledSetting } from "../../domain/mail-enabled-setting";

export const INSTANCE_SETTINGS_CACHE_TTL_MS = 60_000;

@Injectable()
export class InstanceSettingsService {
  // ponytail: per-replica in-memory cache; an update is visible at once on the
  // replica that handled it and within the TTL everywhere else.
  private cache: { stored: InstanceSettings; loadedAt: number } | null = null;

  constructor(
    private readonly repository: InstanceSettingsRepository,
    private readonly envService: EnvService,
  ) {}

  async getSettings(): Promise<InstanceSettings> {
    return this.applyEnvOverrides(await this.loadStored());
  }

  async updateSettings(updates: Partial<InstanceSettingsDbProps>): Promise<InstanceSettings> {
    const stored = await this.loadStored();
    // enforce env locks against the effective settings, but persist the update
    // on the stored ones so env-forced values never end up in the DB
    this.applyEnvOverrides(stored).update(updates);
    const saved = await this.repository.save(stored.update(updates));
    this.remember(saved);
    return this.applyEnvOverrides(saved);
  }

  private async loadStored(): Promise<InstanceSettings> {
    if (this.cache && Date.now() - this.cache.loadedAt < INSTANCE_SETTINGS_CACHE_TTL_MS) {
      return this.cache.stored;
    }
    const stored =
      (await this.repository.findOne()) ??
      (await this.repository.save(InstanceSettings.create({ signupEnabled: { value: true } })));
    this.remember(stored);
    return stored;
  }

  private remember(stored: InstanceSettings): void {
    this.cache = { stored, loadedAt: Date.now() };
  }

  private applyEnvOverrides(settings: InstanceSettings): InstanceSettings {
    const enforcedSignup = this.envService.get(SignupEnabledSetting.ENV_NAME);
    const envOrganizationCreationEnabled = this.envService.get(
      OrganizationCreationEnabledSetting.ENV_NAME,
    );
    const envPermalinkBaseUrl = this.envService.get(PermalinkBaseUrlSetting.ENV_NAME);
    // no SMTP host ⇒ mail is off no matter what; otherwise the env lock (if any)
    const envMailEnabled = this.envService.get("OPEN_DPP_MAIL_HOST")
      ? this.envService.get(MailEnabledSetting.ENV_NAME)
      : false;

    return settings.withEnvOverrides({
      signupEnabled: enforcedSignup,
      organizationCreationEnabled: envOrganizationCreationEnabled,
      permalinkBaseUrl: envPermalinkBaseUrl,
      mailEnabled: envMailEnabled,
    });
  }
}
