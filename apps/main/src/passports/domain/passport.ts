import { IDigitalProductPassportIdentifiable } from "../../aas/domain/digital-product-passport-identifiable";
import { Environment } from "../../aas/domain/environment";
import { PassportJsonSchema } from "../../aas/domain/parsing/passport-json-schema";
import { IPersistable } from "../../aas/domain/persistable";

export class Passport implements IPersistable, IDigitalProductPassportIdentifiable {
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

  static fromPlain(data: unknown) {
    const parsed = PassportJsonSchema.parse(data);
    return new Passport(
      parsed.id,
      parsed.organizationId,
      Environment.fromPlain(parsed.environment),
    );
  }

  toPlain() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      environment: this.environment.toPlain(),
    };
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  getOrganizationId(): string {
    return this.organizationId;
  }
}
