import { ValueError } from "@open-dpp/exception";

export type InstanceSettingCreateProps<V> = {
  value?: V;
  locked?: boolean;
};
export type InstanceSettingResponse<V> = { value: V; locked?: boolean };

/**
 * One instance setting: its value and whether the env locks it. A lock carries the
 * reason a rejected update names, by default that the setting's env variable is set.
 */
export class InstanceSetting<V> {
  private constructor(
    public readonly name: string,
    public readonly envName: string,
    public readonly value: V,
    public readonly locked?: boolean,
    private readonly lockReason?: string,
  ) {}

  public static create<V>(
    name: string,
    envName: string,
    value: V,
    locked?: boolean,
  ): InstanceSetting<V> {
    return new InstanceSetting(name, envName, value, locked);
  }

  /** Forces and locks `envValue`; `undefined` (env variable unset) keeps the value, unlocked. */
  public withEnvOverride(envValue: V | undefined, lockReason?: string): InstanceSetting<V> {
    if (envValue === undefined) {
      return new InstanceSetting(this.name, this.envName, this.value);
    }
    return new InstanceSetting(this.name, this.envName, envValue, true, lockReason);
  }

  public update(newValue: V | undefined): InstanceSetting<V> {
    this.assertCanChangeTo(newValue);
    return new InstanceSetting(
      this.name,
      this.envName,
      newValue !== undefined ? newValue : this.value,
      this.locked,
      this.lockReason,
    );
  }

  /** Throws a ValueError naming the lock when `newValue` would change a locked setting. */
  public assertCanChangeTo(newValue: V | undefined): void {
    if (this.locked && newValue !== undefined && newValue !== this.value) {
      const reason = this.lockReason ?? `${this.envName} is set`;
      throw new ValueError(`Cannot override ${this.name} when ${reason}`);
    }
  }

  public toResponse(): InstanceSettingResponse<V> {
    return { value: this.value, locked: this.locked };
  }
}
