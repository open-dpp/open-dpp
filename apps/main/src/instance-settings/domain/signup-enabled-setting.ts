import {
  BooleanInstanceSetting,
  BooleanInstanceSettingCreateProps,
} from "./boolean-instance-setting";

export class SignupEnabledSetting extends BooleanInstanceSetting {
  static readonly ENV_NAME = "OPEN_DPP_INSTANCE_SIGNUP_ENABLED";

  public static create(data: BooleanInstanceSettingCreateProps) {
    return new BooleanInstanceSetting(
      "signupEnabled",
      SignupEnabledSetting.ENV_NAME,
      data.value ?? true,
      data.locked,
    );
  }
}
