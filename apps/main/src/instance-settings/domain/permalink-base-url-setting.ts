import { StringInstanceSetting, StringInstanceSettingCreateProps } from "./string-instance-setting";

export class PermalinkBaseUrlSetting extends StringInstanceSetting {
  static readonly ENV_NAME = "OPEN_DPP_PERMALINK_BASE_URL";
  static readonly NAME = "permalinkBaseUrl";

  public static create(data: StringInstanceSettingCreateProps = {}): StringInstanceSetting {
    return new StringInstanceSetting(
      PermalinkBaseUrlSetting.NAME,
      PermalinkBaseUrlSetting.ENV_NAME,
      data.value ?? null,
      data.locked,
    );
  }
}
