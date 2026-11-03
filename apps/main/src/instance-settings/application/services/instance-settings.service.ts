import { Injectable } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { InstanceSettings, InstanceSettingsUpdate } from "../../domain/instance-settings";
import { MailEnabledSetting } from "../../domain/mail-enabled-setting";
import { OrganizationCreationEnabledSetting } from "../../domain/organization-creation-enabled-setting";
import { PermalinkBaseUrlSetting } from "../../domain/permalink-base-url-setting";
import { SignupEnabledSetting } from "../../domain/signup-enabled-setting";
import { InstanceSettingsRepository } from "../../infrastructure/adapters/instance-settings.repository";
import { InstanceSettingsCache } from "./instance-settings.cache";

export const INSTANCE_SETTINGS_CACHE_TTL_MS = 60_000;

@Injectable()
export class InstanceSettingsService {
  private readonly cache = new InstanceSettingsCache(INSTANCE_SETTINGS_CACHE_TTL_MS);

  constructor(
    private readonly repository: InstanceSettingsRepository,
    private readonly envService: EnvService,
  ) {}

  async getSettings(): Promise<InstanceSettings> {
    return this.applyEnvOverrides(await this.loadStored());
  }

  async updateSettings(updates: InstanceSettingsUpdate): Promise<InstanceSettings> {
    // save() replaces the whole singleton document, so the write must start from
    // the DB, not from a possibly stale cache of another replica's state
    const stored = await this.loadStored({ fresh: true });
    // locks are checked on the effective settings, but the update is persisted on
    // the stored ones so env-forced values never end up in the DB
    const persistable = this.applyEnvOverrides(stored).persistableUpdates(updates);
    const saved = await this.repository.save(stored.update(persistable));
    this.cache.set(saved);
    return this.applyEnvOverrides(saved);
  }

  private async loadStored(options?: { fresh: boolean }): Promise<InstanceSettings> {
    const cached = options?.fresh ? undefined : this.cache.get();
    if (cached) {
      return cached;
    }
    const stored =
      (await this.repository.findOne()) ??
      (await this.repository.save(InstanceSettings.create({ signupEnabled: { value: true } })));
    this.cache.set(stored);
    return stored;
  }

  private applyEnvOverrides(settings: InstanceSettings): InstanceSettings {
    const overridden = settings.withEnvOverrides({
      signupEnabled: this.envService.get(SignupEnabledSetting.ENV_NAME),
      organizationCreationEnabled: this.envService.get(OrganizationCreationEnabledSetting.ENV_NAME),
      permalinkBaseUrl: this.envService.get(PermalinkBaseUrlSetting.ENV_NAME),
      mailEnabled: this.envService.get(MailEnabledSetting.ENV_NAME),
    });
    // no SMTP host ⇒ mail is off, whatever OPEN_DPP_INSTANCE_MAIL_ENABLED says
    return this.envService.isMailConfigured() ? overridden : overridden.withMailNotConfigured();
  }
}
