import {
  BooleanInstanceSetting,
  BooleanInstanceSettingCreateProps,
} from "./boolean-instance-setting";

export class OrganizationCreationEnabledSetting extends BooleanInstanceSetting {
  static readonly ENV_NAME = "OPEN_DPP_INSTANCE_ORGANIZATION_CREATION_ENABLED";

  public static create(data: BooleanInstanceSettingCreateProps) {
    return new BooleanInstanceSetting(
      "organizationCreationEnabled",
      OrganizationCreationEnabledSetting.ENV_NAME,
      data.value ?? true,
      data.locked,
    );
  }
}
