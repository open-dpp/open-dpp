import { randomUUID } from "node:crypto";

export interface InstanceSettingsCreateProps {
  signupEnabled?: {
    value: boolean;
    locked?: boolean;
  };
}

export interface InstanceSettingsDbProps {
  id: string;
  signupEnabled: boolean;
}

export interface InstanceSettingsResponseProps {
  id: string;
  signupEnabled: {
    value: boolean;
    locked?: boolean;
  };
}

export interface EnvOverrideProps {
  signupEnabled?: boolean;
}

type SignupEnabledState = Readonly<{
  value: boolean;
  locked?: boolean;
}>;

export class InstanceSettings {
  public readonly id: string;
  public readonly signupEnabled: SignupEnabledState;

  private constructor(
    id: string,
    signupEnabled: {
      value: boolean;
      locked?: boolean;
    },
  ) {
    this.id = id;
    this.signupEnabled = Object.freeze({ ...signupEnabled });
  }

  public static create(props: InstanceSettingsCreateProps = {}): InstanceSettings {
    return new InstanceSettings(
      randomUUID(),
      props.signupEnabled ?? { value: true, locked: false },
    );
  }

  public static loadFromDb(props: InstanceSettingsDbProps): InstanceSettings {
    return new InstanceSettings(props.id, { value: props.signupEnabled });
  }

  public withEnvOverrides(overrides: EnvOverrideProps): InstanceSettings {
    return new InstanceSettings(this.id, {
      value:
        overrides.signupEnabled !== undefined ? overrides.signupEnabled : this.signupEnabled.value,
      locked: overrides.signupEnabled === undefined ? undefined : true,
    });
  }

  public update(props: Partial<InstanceSettingsDbProps>): InstanceSettings {
    return new InstanceSettings(this.id, {
      value: props.signupEnabled !== undefined ? props.signupEnabled : this.signupEnabled.value,
    });
  }

  public toPlain(): InstanceSettingsDbProps {
    return {
      id: this.id,
      signupEnabled: this.signupEnabled.value,
    };
  }

  public toResponse(): InstanceSettingsResponseProps {
    return {
      id: this.id,
      signupEnabled: { ...this.signupEnabled },
    };
  }
}
