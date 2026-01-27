import { randomUUID } from "node:crypto";
import { PassportDtoSchema } from "@open-dpp/dto";
import { IDigitalProductPassportIdentifiable } from "../../aas/domain/digital-product-passport-identifiable";
import { Environment } from "../../aas/domain/environment";
import { IPersistable } from "../../aas/domain/persistable";
import { DateTime } from "../../lib/date-time";
import { HasCreatedAt } from "../../lib/has-created-at";

export class Passport implements IPersistable, IDigitalProductPassportIdentifiable, HasCreatedAt {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly templateId: string | null,
    public readonly environment: Environment,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
  }

  static create(data: {
    id?: string;
    organizationId: string;
    templateId?: string;
    environment: Environment;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    const now = DateTime.now();

    return new Passport(
      data.id ?? randomUUID(),
      data.organizationId,
      data.templateId ?? null,
      data.environment,
      data.createdAt ?? now,
      data.updatedAt ?? now,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = PassportDtoSchema.parse(data);
    return new Passport(
      parsed.id,
      parsed.organizationId,
      parsed.templateId,
      Environment.fromPlain(parsed.environment),
      new Date(parsed.createdAt),
      new Date(parsed.updatedAt),
    );
  }

  toPlain() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      environment: this.environment.toPlain(),
      templateId: this.templateId,
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
