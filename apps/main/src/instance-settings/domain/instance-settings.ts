import { randomUUID } from "node:crypto";
import {
  BooleanInstanceSettingCreateProps,
  BooleanInstanceSettingResponse,
} from "./boolean-instance-setting";
import { SignupEnabledSetting } from "./signup-enabled-setting";
import { OrganizationCreationEnabledSetting } from "./organization-creation-enabled-setting";
import { PermalinkBaseUrlSetting } from "./permalink-base-url-setting";
import { Gs1ResolverBaseUrlSetting } from "./gs1-resolver-base-url-setting";
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
  gs1ResolverBaseUrl?: StringInstanceSettingCreatePropsWithoutName;
}

export interface InstanceSettingsDbProps {
  id: string;
  signupEnabled: boolean;
  organizationCreationEnabled: boolean;
  permalinkBaseUrl: string | null;
  gs1ResolverBaseUrl: string | null;
}

export interface InstanceSettingsResponseProps {
  id: string;
  signupEnabled: BooleanInstanceSettingResponse;
  organizationCreationEnabled: BooleanInstanceSettingResponse;
  permalinkBaseUrl: StringInstanceSettingResponse;
  gs1ResolverBaseUrl: StringInstanceSettingResponse;
}

export interface EnvOverrideProps {
  signupEnabled?: boolean;
  organizationCreationEnabled?: boolean;
  permalinkBaseUrl?: string;
  gs1ResolverBaseUrl?: string;
}

export class InstanceSettings {
  private constructor(
    public readonly id: string,
    public readonly signupEnabled: SignupEnabledSetting,
    public readonly organizationCreationEnabled: OrganizationCreationEnabledSetting,
    public readonly permalinkBaseUrl: StringInstanceSetting,
    public readonly gs1ResolverBaseUrl: StringInstanceSetting,
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
      props.gs1ResolverBaseUrl
        ? Gs1ResolverBaseUrlSetting.create(props.gs1ResolverBaseUrl)
        : Gs1ResolverBaseUrlSetting.create({}),
    );
  }

  public static loadFromDb(props: InstanceSettingsDbProps): InstanceSettings {
    return new InstanceSettings(
      props.id,
      SignupEnabledSetting.create({ value: props.signupEnabled }),
      OrganizationCreationEnabledSetting.create({ value: props.organizationCreationEnabled }),
      PermalinkBaseUrlSetting.create({ value: props.permalinkBaseUrl }),
      Gs1ResolverBaseUrlSetting.create({ value: props.gs1ResolverBaseUrl ?? null }),
    );
  }

  public withEnvOverrides(overrides: EnvOverrideProps): InstanceSettings {
    return new InstanceSettings(
      this.id,
      this.signupEnabled.withEnvOverrides(overrides.signupEnabled),
      this.organizationCreationEnabled.withEnvOverrides(overrides.organizationCreationEnabled),
      this.permalinkBaseUrl.withEnvOverrides(overrides.permalinkBaseUrl),
      this.gs1ResolverBaseUrl.withEnvOverrides(overrides.gs1ResolverBaseUrl),
    );
  }

  public update(props: Partial<InstanceSettingsDbProps>): InstanceSettings {
    return new InstanceSettings(
      this.id,
      this.signupEnabled.update(props.signupEnabled),
      this.organizationCreationEnabled.update(props.organizationCreationEnabled),
      this.permalinkBaseUrl.update(props.permalinkBaseUrl),
      this.gs1ResolverBaseUrl.update(props.gs1ResolverBaseUrl),
    );
  }

  public toPlain(): InstanceSettingsDbProps {
    return {
      id: this.id,
      signupEnabled: this.signupEnabled.value,
      organizationCreationEnabled: this.organizationCreationEnabled.value,
      permalinkBaseUrl: this.permalinkBaseUrl.value,
      gs1ResolverBaseUrl: this.gs1ResolverBaseUrl.value,
    };
  }

  public toResponse(): InstanceSettingsResponseProps {
    return {
      id: this.id,
      signupEnabled: this.signupEnabled.toResponse(),
      organizationCreationEnabled: this.organizationCreationEnabled.toResponse(),
      permalinkBaseUrl: this.permalinkBaseUrl.toResponse(),
      gs1ResolverBaseUrl: this.gs1ResolverBaseUrl.toResponse(),
    };
  }
}
