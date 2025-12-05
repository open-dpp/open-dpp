import { IDigitalProductPassportIdentifiable } from "../../aas/domain/digital-product-passport-identifiable";
import { Environment } from "../../aas/domain/environment";
import { TemplateJsonSchema } from "../../aas/domain/parsing/passport-json-schema";
import { IPersistable } from "../../aas/domain/persistable";

export class Template implements IPersistable, IDigitalProductPassportIdentifiable {
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
    return new Template(
      data.id,
      data.organizationId,
      data.environment,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = TemplateJsonSchema.parse(data);
    return Template.create({
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

  getEnvironment(): Environment {
    return this.environment;
  }

  getOrganizationId(): string {
    return this.organizationId;
  }
}
