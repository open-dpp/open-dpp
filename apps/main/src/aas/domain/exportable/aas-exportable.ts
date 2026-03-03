import { randomUUID } from "node:crypto";
import { PassportDtoSchema } from "@open-dpp/dto";
import { DateTime } from "../../../lib/date-time";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import { ExpandedEnvironment } from "../expanded-environment";

export class AasExportable {
  private readonly EXPORT_FORMAT = "open-dpp:json";
  private readonly EXPORT_VERSION = "1.0";

  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly templateId: string | null,
    public readonly environment: ExpandedEnvironment,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
  }

  static create(data: {
    id?: string;
    organizationId: string;
    templateId?: string;
    environment: ExpandedEnvironment;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    const now = DateTime.now();

    return new AasExportable(
      data.id ?? randomUUID(),
      data.organizationId,
      data.templateId ?? null,
      data.environment,
      data.createdAt ?? now,
      data.updatedAt ?? now,
    );
  }

  static createFromPassport(data: Passport, expandedEnvironment: ExpandedEnvironment) {
    const now = DateTime.now();
    return new AasExportable(
      data.id ?? randomUUID(),
      data.organizationId,
      data.templateId ?? null,
      expandedEnvironment,
      data.createdAt ?? now,
      data.updatedAt ?? now,
    );
  }

  static createFromTemplate(data: Template, expandedEnvironment: ExpandedEnvironment) {
    const now = DateTime.now();
    return new AasExportable(
      data.id ?? randomUUID(),
      data.organizationId,
      null,
      expandedEnvironment,
      data.createdAt ?? now,
      data.updatedAt ?? now,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = PassportDtoSchema.parse(data);
    return new AasExportable(
      parsed.id,
      parsed.organizationId,
      parsed.templateId,
      ExpandedEnvironment.fromPlain(parsed.environment),
      new Date(parsed.createdAt),
      new Date(parsed.updatedAt),
    );
  }

  toExportPlain() {
    return {
      id: this.id,
      environment: this.environment.toPlain(),
      templateId: this.templateId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      format: this.EXPORT_FORMAT,
      version: this.EXPORT_VERSION,
    };
  }
}
