import { ValueError } from "@open-dpp/exception";

export type StringInstanceSettingCreateProps = {
  value?: string | null;
  locked?: boolean;
};
export type StringInstanceSettingResponse = { value: string | null; locked?: boolean };

export class StringInstanceSetting {
  protected constructor(
    public readonly name: string,
    public readonly envName: string,
    public readonly value: string | null,
    public readonly locked?: boolean,
  ) {}

  public withEnvOverrides(envValue: string | undefined): StringInstanceSetting {
    return new StringInstanceSetting(
      this.name,
      this.envName,
      envValue !== undefined ? envValue : this.value,
      envValue === undefined ? undefined : true,
    );
  }

  public update(newValue: string | null | undefined): StringInstanceSetting {
    if (this.locked && newValue !== undefined && newValue !== this.value) {
      throw new ValueError(`Cannot override ${this.name} when ${this.envName} is set`);
    }
    return new StringInstanceSetting(
      this.name,
      this.envName,
      newValue !== undefined ? newValue : this.value,
      this.locked,
    );
  }

  public toResponse(): StringInstanceSettingResponse {
    return { value: this.value, locked: this.locked };
  }
}
