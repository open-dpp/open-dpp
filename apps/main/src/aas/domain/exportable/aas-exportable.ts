import { randomUUID } from "node:crypto";
import { DateTime } from "../../../lib/date-time";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import { aasExportSchemaJsonV1_0 } from "../../infrastructure/serialization/aas-export-v1.schema";
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
  ) {}

  static create(data: {
    id?: string;
    organizationId: string;
    templateId?: string | null;
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
    return AasExportable.create({
      id: data.id,
      organizationId: data.organizationId,
      templateId: data.templateId,
      environment: expandedEnvironment,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  static createFromTemplate(data: Template, expandedEnvironment: ExpandedEnvironment) {
    return AasExportable.create({
      id: data.id,
      organizationId: data.organizationId,
      environment: expandedEnvironment,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  static fromPlain(data: unknown, organizationId: string, templateId: string | null = null) {
    const parsed = aasExportSchemaJsonV1_0.parse(data);
    return new AasExportable(
      parsed.id,
      organizationId,
      templateId,
      ExpandedEnvironment.fromPlain(parsed.environment),
      parsed.createdAt,
      parsed.updatedAt,
    );
  }

  toExportPlain() {
    const envPlain = this.environment.toPlain();
    return {
      id: this.id,
      environment: {
        ...envPlain,
        assetAdministrationShells: envPlain.assetAdministrationShells,
      },
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      format: this.EXPORT_FORMAT,
      version: this.EXPORT_VERSION,
    };
  }
}
