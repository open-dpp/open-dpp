import { randomUUID } from "node:crypto";

export interface InstanceSettingsCreateProps {
  signupEnabled?: boolean;
}

export interface InstanceSettingsDbProps {
  id: string;
  signupEnabled: boolean;
}

export class InstanceSettings {
  public readonly id: string;
  public readonly signupEnabled: boolean;

  private constructor(id: string, signupEnabled: boolean) {
    this.id = id;
    this.signupEnabled = signupEnabled;
  }

  public static create(props: InstanceSettingsCreateProps = {}): InstanceSettings {
    return new InstanceSettings(
      randomUUID(),
      props.signupEnabled ?? true,
    );
  }

  public static loadFromDb(props: InstanceSettingsDbProps): InstanceSettings {
    return new InstanceSettings(props.id, props.signupEnabled);
  }

  public update(props: Partial<InstanceSettingsCreateProps>): InstanceSettings {
    return new InstanceSettings(
      this.id,
      props.signupEnabled ?? this.signupEnabled,
    );
  }

  public toPlain(): InstanceSettingsDbProps {
    return {
      id: this.id,
      signupEnabled: this.signupEnabled,
    };
  }
}
