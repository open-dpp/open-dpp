import { InstanceSetting, InstanceSettingCreateProps } from "./instance-setting";

export class PermalinkBaseUrlSetting {
  static readonly ENV_NAME = "OPEN_DPP_PERMALINK_BASE_URL";
  static readonly NAME = "permalinkBaseUrl";

  public static create(
    data: InstanceSettingCreateProps<string | null> = {},
  ): InstanceSetting<string | null> {
    return InstanceSetting.create(
      PermalinkBaseUrlSetting.NAME,
      PermalinkBaseUrlSetting.ENV_NAME,
      data.value ?? null,
      data.locked,
    );
  }
}
