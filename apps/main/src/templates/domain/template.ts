import { randomUUID } from "node:crypto";
import { TemplateDtoSchema } from "@open-dpp/dto";
import { IDigitalProductPassportIdentifiable } from "../../aas/domain/digital-product-passport-identifiable";
import { Environment } from "../../aas/domain/environment";
import { IPersistable } from "../../aas/domain/persistable";
import { DateTime } from "../../lib/date-time";
import { HasCreatedAt } from "../../lib/has-created-at";

export class Template implements IPersistable, IDigitalProductPassportIdentifiable, HasCreatedAt {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly environment: Environment,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
  }

  static create(data: {
    id?: string;
    organizationId: string;
    environment?: Environment;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    const now = DateTime.now();
    return new Template(
      data.id ?? randomUUID(),
      data.organizationId,
      data.environment ?? Environment.create({}),
      data.createdAt ?? now,
      data.updatedAt ?? now,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = TemplateDtoSchema.parse(data);
    return new Template(
      parsed.id,
      parsed.organizationId,
      Environment.fromPlain(parsed.environment),
      parsed.createdAt,
      parsed.updatedAt,
    );
  }

  toPlain() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      environment: this.environment.toPlain(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  getOrganizationId(): string {
    return this.organizationId;
  }
}
