import { ValueError } from "@open-dpp/exception";

export type BooleanInstanceSettingCreateProps = {
  value?: boolean;
  locked?: boolean;
};
export type BooleanInstanceSettingResponse = { value: boolean; locked?: boolean };

export class BooleanInstanceSetting {
  protected constructor(
    public readonly name: string,
    public readonly envName: string,
    public readonly value: boolean,
    public readonly locked?: boolean,
  ) {}

  public withEnvOverrides(envValue: boolean | undefined): BooleanInstanceSetting {
    return new BooleanInstanceSetting(
      this.name,
      this.envName,
      envValue !== undefined ? envValue : this.value,
      envValue === undefined ? undefined : true,
    );
  }

  public update(newValue: boolean | undefined): BooleanInstanceSetting {
    if (this.locked && newValue !== undefined && newValue !== this.value) {
      throw new ValueError(`Cannot override ${this.name} when ${this.envName} is set`);
    }
    return new BooleanInstanceSetting(
      this.name,
      this.envName,
      newValue !== undefined ? newValue : this.value,
      this.locked,
    );
  }

  public toResponse(): BooleanInstanceSettingResponse {
    return { value: this.value, locked: this.locked };
  }
}
