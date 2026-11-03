import { InstanceSetting, InstanceSettingCreateProps } from "./instance-setting";

export class OrganizationCreationEnabledSetting {
  static readonly ENV_NAME = "OPEN_DPP_INSTANCE_ORGANIZATION_CREATION_ENABLED";

  public static create(data: InstanceSettingCreateProps<boolean>): InstanceSetting<boolean> {
    return InstanceSetting.create(
      "organizationCreationEnabled",
      OrganizationCreationEnabledSetting.ENV_NAME,
      data.value ?? true,
      data.locked,
    );
  }
}
