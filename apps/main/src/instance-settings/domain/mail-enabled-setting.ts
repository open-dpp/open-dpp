import {
  BooleanInstanceSetting,
  BooleanInstanceSettingCreateProps,
} from "./boolean-instance-setting";

export class MailEnabledSetting extends BooleanInstanceSetting {
  static readonly ENV_NAME = "OPEN_DPP_INSTANCE_MAIL_ENABLED";

  public static create(data: BooleanInstanceSettingCreateProps) {
    return new BooleanInstanceSetting(
      "mailEnabled",
      MailEnabledSetting.ENV_NAME,
      data.value ?? true,
      data.locked,
    );
  }
}
