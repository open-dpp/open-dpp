import { InstanceSetting, InstanceSettingCreateProps } from "./instance-setting";

export class MailEnabledSetting {
  static readonly ENV_NAME = "OPEN_DPP_INSTANCE_MAIL_ENABLED";
  /** Why mail is locked off while no SMTP host is configured. */
  static readonly NOT_CONFIGURED_LOCK_REASON = "OPEN_DPP_MAIL_HOST is not set";

  public static create(data: InstanceSettingCreateProps<boolean>): InstanceSetting<boolean> {
    return InstanceSetting.create(
      "mailEnabled",
      MailEnabledSetting.ENV_NAME,
      data.value ?? true,
      data.locked,
    );
  }
}
