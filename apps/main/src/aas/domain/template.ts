import { IDigitalProductPassportIdentifiable } from "./digital-product-passport-identifiable";
import { Environment } from "./environment";
import { TemplateJsonSchema } from "./parsing/passport-json-schema";
import { IPersistable } from "./persistable";

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

  static fromPlain(data: Record<string, unknown>) {
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

  ownedByOrganization(organizationId: string): boolean {
    return this.organizationId === organizationId;
  }
}
