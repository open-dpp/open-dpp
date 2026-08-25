import { randomUUID } from "node:crypto";
import {
  BooleanInstanceSettingCreateProps,
  BooleanInstanceSettingResponse,
} from "./boolean-instance-setting";
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
}

export interface InstanceSettingsDbProps {
  id: string;
  signupEnabled: boolean;
  organizationCreationEnabled: boolean;
  permalinkBaseUrl: string | null;
}

export interface InstanceSettingsResponseProps {
  id: string;
  signupEnabled: BooleanInstanceSettingResponse;
  organizationCreationEnabled: BooleanInstanceSettingResponse;
  permalinkBaseUrl: StringInstanceSettingResponse;
}

export interface EnvOverrideProps {
  signupEnabled?: boolean;
  organizationCreationEnabled?: boolean;
  permalinkBaseUrl?: string;
}

export class InstanceSettings {
  private constructor(
    public readonly id: string,
    public readonly signupEnabled: SignupEnabledSetting,
    public readonly organizationCreationEnabled: OrganizationCreationEnabledSetting,
    public readonly permalinkBaseUrl: StringInstanceSetting,
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
    );
  }

  public static loadFromDb(props: InstanceSettingsDbProps): InstanceSettings {
    return new InstanceSettings(
      props.id,
      SignupEnabledSetting.create({ value: props.signupEnabled }),
      OrganizationCreationEnabledSetting.create({ value: props.organizationCreationEnabled }),
      PermalinkBaseUrlSetting.create({ value: props.permalinkBaseUrl }),
    );
  }

  public withEnvOverrides(overrides: EnvOverrideProps): InstanceSettings {
    return new InstanceSettings(
      this.id,
      this.signupEnabled.withEnvOverrides(overrides.signupEnabled),
      this.organizationCreationEnabled.withEnvOverrides(overrides.organizationCreationEnabled),
      this.permalinkBaseUrl.withEnvOverrides(overrides.permalinkBaseUrl),
    );
  }

  public update(props: Partial<InstanceSettingsDbProps>): InstanceSettings {
    return new InstanceSettings(
      this.id,
      this.signupEnabled.update(props.signupEnabled),
      this.organizationCreationEnabled.update(props.organizationCreationEnabled),
      this.permalinkBaseUrl.update(props.permalinkBaseUrl),
    );
  }

  public toPlain(): InstanceSettingsDbProps {
    return {
      id: this.id,
      signupEnabled: this.signupEnabled.value,
      organizationCreationEnabled: this.organizationCreationEnabled.value,
      permalinkBaseUrl: this.permalinkBaseUrl.value,
    };
  }

  public toResponse(): InstanceSettingsResponseProps {
    return {
      id: this.id,
      signupEnabled: this.signupEnabled.toResponse(),
      organizationCreationEnabled: this.organizationCreationEnabled.toResponse(),
      permalinkBaseUrl: this.permalinkBaseUrl.toResponse(),
    };
  }
}
