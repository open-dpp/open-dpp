import { Environment } from "./environment";
import { IPersistable } from "./IPersistable";
import { PassportJsonSchema } from "./parsing/passport-json-schema";

export class Passport implements IPersistable {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly environment: Environment,
  ) {
  }

  static create(data: {
    id: string;
    organizationId: string;
    environment: Environment;
  }) {
    return new Passport(
      data.id,
      data.organizationId,
      data.environment,
    );
  }

  static fromPlain(data: Record<string, unknown>) {
    const parsed = PassportJsonSchema.parse(data);
    return Passport.create({
      id: parsed.id,
      organizationId: parsed.organizationId,
      environment: Environment.fromPlain(parsed.environment),
    });
  }

  toPlain() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      environment: this.environment.toPlain(),
    };
  }
}
