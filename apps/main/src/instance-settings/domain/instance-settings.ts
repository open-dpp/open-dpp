import { randomUUID } from "node:crypto";
import {
  BooleanInstanceSettingCreateProps,
  BooleanInstanceSettingResponse,
} from "./boolean-instance-setting";
import { MailEnabledSetting } from "./mail-enabled-setting";
import { SignupEnabledSetting } from "./signup-enabled-setting";
import { OrganizationCreationEnabledSetting } from "./organization-creation-enabled-setting";
import { PermalinkBaseUrlSetting } from "./permalink-base-url-setting";
import {
  StringInstanceSetting,
  StringInstanceSettingCreateProps,
  StringInstanceSettingResponse,
} from "./string-instance-setting";

type BooleanInstanceSettingCreatePropsWithoutName = Omit<
  BooleanInstanceSettingCreateProps,
  "name" | "envName"
>;
type StringInstanceSettingCreatePropsWithoutName = Omit<
  StringInstanceSettingCreateProps,
  "name" | "envName"
>;
export interface InstanceSettingsCreateProps {
  signupEnabled?: BooleanInstanceSettingCreatePropsWithoutName;
  organizationCreationEnabled?: BooleanInstanceSettingCreatePropsWithoutName;
  permalinkBaseUrl?: StringInstanceSettingCreatePropsWithoutName;
  mailEnabled?: BooleanInstanceSettingCreatePropsWithoutName;
}

export interface InstanceSettingsDbProps {
  id: string;
  signupEnabled: boolean;
  organizationCreationEnabled: boolean;
  permalinkBaseUrl: string | null;
  mailEnabled: boolean;
}

export interface InstanceSettingsResponseProps {
  id: string;
  signupEnabled: BooleanInstanceSettingResponse;
  organizationCreationEnabled: BooleanInstanceSettingResponse;
  permalinkBaseUrl: StringInstanceSettingResponse;
  mailEnabled: BooleanInstanceSettingResponse;
}

export interface EnvOverrideProps {
  signupEnabled?: boolean;
  organizationCreationEnabled?: boolean;
  permalinkBaseUrl?: string;
  mailEnabled?: boolean;
}

export class InstanceSettings {
  private constructor(
    public readonly id: string,
    public readonly signupEnabled: SignupEnabledSetting,
    public readonly organizationCreationEnabled: OrganizationCreationEnabledSetting,
    public readonly permalinkBaseUrl: StringInstanceSetting,
    public readonly mailEnabled: MailEnabledSetting,
  ) {}

  public static create(props: InstanceSettingsCreateProps = {}): InstanceSettings {
    return new InstanceSettings(
      randomUUID(),
      props.signupEnabled
        ? SignupEnabledSetting.create(props.signupEnabled)
        : SignupEnabledSetting.create({}),
      props.organizationCreationEnabled
        ? OrganizationCreationEnabledSetting.create(props.organizationCreationEnabled)
        : OrganizationCreationEnabledSetting.create({}),
      props.permalinkBaseUrl
        ? PermalinkBaseUrlSetting.create(props.permalinkBaseUrl)
        : PermalinkBaseUrlSetting.create({}),
      MailEnabledSetting.create(props.mailEnabled ?? {}),
    );
  }

  public static loadFromDb(props: InstanceSettingsDbProps): InstanceSettings {
    return new InstanceSettings(
      props.id,
      SignupEnabledSetting.create({ value: props.signupEnabled }),
      OrganizationCreationEnabledSetting.create({ value: props.organizationCreationEnabled }),
      PermalinkBaseUrlSetting.create({ value: props.permalinkBaseUrl }),
      // documents written before v1.4.0 carry no mailEnabled → default (on)
      MailEnabledSetting.create({ value: props.mailEnabled }),
    );
  }

  public withEnvOverrides(overrides: EnvOverrideProps): InstanceSettings {
    return new InstanceSettings(
      this.id,
      this.signupEnabled.withEnvOverrides(overrides.signupEnabled),
      this.organizationCreationEnabled.withEnvOverrides(overrides.organizationCreationEnabled),
      this.permalinkBaseUrl.withEnvOverrides(overrides.permalinkBaseUrl),
      this.mailEnabled.withEnvOverrides(overrides.mailEnabled),
    );
  }

  public update(props: Partial<InstanceSettingsDbProps>): InstanceSettings {
    return new InstanceSettings(
      this.id,
      this.signupEnabled.update(props.signupEnabled),
      this.organizationCreationEnabled.update(props.organizationCreationEnabled),
      this.permalinkBaseUrl.update(props.permalinkBaseUrl),
      this.mailEnabled.update(props.mailEnabled),
    );
  }

  public toPlain(): InstanceSettingsDbProps {
    return {
      id: this.id,
      signupEnabled: this.signupEnabled.value,
      organizationCreationEnabled: this.organizationCreationEnabled.value,
      permalinkBaseUrl: this.permalinkBaseUrl.value,
      mailEnabled: this.mailEnabled.value,
    };
  }

  public toResponse(): InstanceSettingsResponseProps {
    return {
      id: this.id,
      signupEnabled: this.signupEnabled.toResponse(),
      organizationCreationEnabled: this.organizationCreationEnabled.toResponse(),
      permalinkBaseUrl: this.permalinkBaseUrl.toResponse(),
      mailEnabled: this.mailEnabled.toResponse(),
    };
  }
}
