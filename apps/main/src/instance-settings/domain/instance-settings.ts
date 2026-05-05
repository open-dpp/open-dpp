import { randomUUID } from "node:crypto";
import {
  BooleanInstanceSettingCreateProps,
  BooleanInstanceSettingResponse,
} from "./boolean-instance-setting";
import { SignupEnabledSetting } from "./signup-enabled-setting";
import { OrganizationCreationEnabledSetting } from "./organization-creation-enabled-setting";

type InstanceSettingCreatePropsWithoutName = Omit<
  BooleanInstanceSettingCreateProps,
  "name" | "envName"
>;
export interface InstanceSettingsCreateProps {
  signupEnabled?: InstanceSettingCreatePropsWithoutName;
  organizationCreationEnabled?: InstanceSettingCreatePropsWithoutName;
}

export interface InstanceSettingsDbProps {
  id: string;
  signupEnabled: boolean;
  organizationCreationEnabled: boolean;
}

export interface InstanceSettingsResponseProps {
  id: string;
  signupEnabled: BooleanInstanceSettingResponse;
  organizationCreationEnabled: BooleanInstanceSettingResponse;
}

export interface EnvOverrideProps {
  signupEnabled?: boolean;
  organizationCreationEnabled?: boolean;
}

export class InstanceSettings {
  private constructor(
    public readonly id: string,
    public readonly signupEnabled: SignupEnabledSetting,
    public readonly organizationCreationEnabled: OrganizationCreationEnabledSetting,
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
    );
  }

  public static loadFromDb(props: InstanceSettingsDbProps): InstanceSettings {
    return new InstanceSettings(
      props.id,
      SignupEnabledSetting.create({ value: props.signupEnabled }),
      OrganizationCreationEnabledSetting.create({ value: props.organizationCreationEnabled }),
    );
  }

  public withEnvOverrides(overrides: EnvOverrideProps): InstanceSettings {
    return new InstanceSettings(
      this.id,
      this.signupEnabled.withEnvOverrides(overrides.signupEnabled),
      this.organizationCreationEnabled.withEnvOverrides(overrides.organizationCreationEnabled),
    );
  }

  public update(props: Partial<InstanceSettingsDbProps>): InstanceSettings {
    return new InstanceSettings(
      this.id,
      this.signupEnabled.update(props.signupEnabled),
      this.organizationCreationEnabled.update(props.organizationCreationEnabled),
    );
  }

  public toPlain(): InstanceSettingsDbProps {
    return {
      id: this.id,
      signupEnabled: this.signupEnabled.value,
      organizationCreationEnabled: this.organizationCreationEnabled.value,
    };
  }

  public toResponse(): InstanceSettingsResponseProps {
    return {
      id: this.id,
      signupEnabled: this.signupEnabled.toResponse(),
      organizationCreationEnabled: this.organizationCreationEnabled.toResponse(),
    };
  }
}
