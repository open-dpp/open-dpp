import { randomUUID } from "node:crypto";
import {
  InstanceSetting,
  InstanceSettingCreateProps,
  InstanceSettingResponse,
} from "./instance-setting";
import { MailEnabledSetting } from "./mail-enabled-setting";
import { OrganizationCreationEnabledSetting } from "./organization-creation-enabled-setting";
import { PermalinkBaseUrlSetting } from "./permalink-base-url-setting";
import { SignupEnabledSetting } from "./signup-enabled-setting";

/**
 * The value of every instance setting. A new setting is added here, in SETTING_FACTORIES
 * and as a getter on InstanceSettings; every other method walks all settings by itself.
 */
export interface InstanceSettingValues {
  signupEnabled: boolean;
  organizationCreationEnabled: boolean;
  permalinkBaseUrl: string | null;
  mailEnabled: boolean;
}
type SettingName = keyof InstanceSettingValues;

/** The shapes a setting takes: the domain object, its plain value, its API response. */
type SettingShapes<K extends SettingName> = {
  setting: InstanceSetting<InstanceSettingValues[K]>;
  value: InstanceSettingValues[K];
  response: InstanceSettingResponse<InstanceSettingValues[K]>;
};
type SettingShape = keyof SettingShapes<SettingName>;
/** One entry per setting in the given shape; mapped over `K` so `PerSetting<S, K>[K]` stays exact. */
type PerSetting<S extends SettingShape, K extends SettingName = SettingName> = {
  readonly [P in K]: SettingShapes<P>[S];
};
type Settings = PerSetting<"setting">;

const SETTING_FACTORIES: {
  [K in SettingName]: (
    data: InstanceSettingCreateProps<InstanceSettingValues[K]>,
  ) => InstanceSetting<InstanceSettingValues[K]>;
} = {
  signupEnabled: SignupEnabledSetting.create,
  organizationCreationEnabled: OrganizationCreationEnabledSetting.create,
  permalinkBaseUrl: PermalinkBaseUrlSetting.create,
  mailEnabled: MailEnabledSetting.create,
};
const SETTING_NAMES = Object.keys(SETTING_FACTORIES) as SettingName[];

export type InstanceSettingsCreateProps = {
  [K in SettingName]?: InstanceSettingCreateProps<InstanceSettingValues[K]>;
};
export type InstanceSettingsDbProps = { id: string } & InstanceSettingValues;
export type InstanceSettingsUpdate = Partial<InstanceSettingValues>;
export type InstanceSettingsResponseProps = { id: string } & PerSetting<"response">;
export type EnvOverrideProps = { [K in SettingName]?: InstanceSettingValues[K] };

/** Builds one entry per setting in the given shape: the single walk over all settings. */
function perSetting<S extends SettingShape>(
  build: <K extends SettingName>(name: K) => PerSetting<S, K>[K],
): PerSetting<S> {
  return Object.fromEntries(SETTING_NAMES.map((name) => [name, build(name)])) as PerSetting<S>;
}

export class InstanceSettings {
  private constructor(
    public readonly id: string,
    private readonly settings: Settings,
  ) {}

  get signupEnabled() {
    return this.settings.signupEnabled;
  }

  get organizationCreationEnabled() {
    return this.settings.organizationCreationEnabled;
  }

  get permalinkBaseUrl() {
    return this.settings.permalinkBaseUrl;
  }

  get mailEnabled() {
    return this.settings.mailEnabled;
  }

  public static create(props: InstanceSettingsCreateProps = {}): InstanceSettings {
    return new InstanceSettings(
      randomUUID(),
      perSetting<"setting">((name) => SETTING_FACTORIES[name](props[name] ?? {})),
    );
  }

  public static loadFromDb(props: InstanceSettingsDbProps): InstanceSettings {
    // documents written before v1.4.0 carry no mailEnabled → its default (on)
    return new InstanceSettings(
      props.id,
      perSetting<"setting">((name) => SETTING_FACTORIES[name]({ value: props[name] })),
    );
  }

  public withEnvOverrides(overrides: EnvOverrideProps): InstanceSettings {
    return new InstanceSettings(
      this.id,
      perSetting<"setting">((name) => this.settings[name].withEnvOverride(overrides[name])),
    );
  }

  /** Without an SMTP host mail cannot be sent: forced off and locked, whatever env or DB say. */
  public withMailNotConfigured(): InstanceSettings {
    return new InstanceSettings(this.id, {
      ...this.settings,
      mailEnabled: this.settings.mailEnabled.withEnvOverride(
        false,
        MailEnabledSetting.NOT_CONFIGURED_LOCK_REASON,
      ),
    });
  }

  /**
   * The part of `updates` to persist on the stored settings. Throws a ValueError naming
   * the lock when an update would change a locked setting, and drops updates to locked
   * settings: their value comes from the env and must never end up in the DB.
   */
  public persistableUpdates(updates: InstanceSettingsUpdate): InstanceSettingsUpdate {
    SETTING_NAMES.forEach((name) => this.assertCanUpdate(name, updates[name]));
    const persistable = SETTING_NAMES.filter(
      (name) => updates[name] !== undefined && !this.settings[name].locked,
    );
    return Object.fromEntries(persistable.map((name) => [name, updates[name]]));
  }

  public update(props: InstanceSettingsUpdate): InstanceSettings {
    return new InstanceSettings(
      this.id,
      perSetting<"setting">((name) => this.settings[name].update(props[name])),
    );
  }

  public toPlain(): InstanceSettingsDbProps {
    return {
      id: this.id,
      ...perSetting<"value">((name) => this.settings[name].value),
    };
  }

  public toResponse(): InstanceSettingsResponseProps {
    return {
      id: this.id,
      ...perSetting<"response">((name) => this.settings[name].toResponse()),
    };
  }

  private assertCanUpdate<K extends SettingName>(
    name: K,
    value: InstanceSettingValues[K] | undefined,
  ): void {
    this.settings[name].assertCanChangeTo(value);
  }
}
