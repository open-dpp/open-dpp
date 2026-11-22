import { InstanceSetting, InstanceSettingCreateProps } from "./instance-setting";

export class SignupEnabledSetting {
  static readonly ENV_NAME = "OPEN_DPP_INSTANCE_SIGNUP_ENABLED";

  public static create(data: InstanceSettingCreateProps<boolean>): InstanceSetting<boolean> {
    return InstanceSetting.create(
      "signupEnabled",
      SignupEnabledSetting.ENV_NAME,
      data.value ?? true,
      data.locked,
    );
  }
}
