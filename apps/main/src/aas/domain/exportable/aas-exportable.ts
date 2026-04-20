import { randomUUID } from "node:crypto";
import { DateTime } from "../../../lib/date-time";
import { Passport } from "../../../passports/domain/passport";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { Template } from "../../../templates/domain/template";
import { AasExportVersion } from "../../infrastructure/serialization/export-schemas/aas-export-shared";
import { aasExportSchemaJsonV1_0 } from "../../infrastructure/serialization/export-schemas/aas-export-v1.schema";
import { ExpandedEnvironment } from "../expanded-environment";
import { SubjectAttributes } from "../security/subject-attributes";

export class AasExportable {
  private readonly EXPORT_FORMAT = "open-dpp:json";
  // Must stay in lockstep with `aasExportSchemaJsonLatest` in
  // infrastructure/serialization/export-schemas/aas-export-types.ts. Bumping one
  // without the other produces exports whose `version` field disagrees with their shape.
  private readonly EXPORT_VERSION = AasExportVersion.v3_0;

  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly templateId: string | null,
    public readonly environment: ExpandedEnvironment,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly presentationConfiguration: PresentationConfiguration | null = null,
  ) {}

  static create(data: {
    id?: string;
    organizationId: string;
    templateId?: string | null;
    environment: ExpandedEnvironment;
    createdAt?: Date;
    updatedAt?: Date;
    presentationConfiguration?: PresentationConfiguration | null;
  }) {
    const now = DateTime.now();

    return new AasExportable(
      data.id ?? randomUUID(),
      data.organizationId,
      data.templateId ?? null,
      data.environment,
      data.createdAt ?? now,
      data.updatedAt ?? now,
      data.presentationConfiguration ?? null,
    );
  }

  static createFromPassport(
    data: Passport,
    expandedEnvironment: ExpandedEnvironment,
    presentationConfiguration: PresentationConfiguration | null = null,
  ) {
    return AasExportable.create({
      id: data.id,
      organizationId: data.organizationId,
      templateId: data.templateId,
      environment: expandedEnvironment,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      presentationConfiguration,
    });
  }

  static createFromTemplate(
    data: Template,
    expandedEnvironment: ExpandedEnvironment,
    presentationConfiguration: PresentationConfiguration | null = null,
  ) {
    return AasExportable.create({
      id: data.id,
      organizationId: data.organizationId,
      environment: expandedEnvironment,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      presentationConfiguration,
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

  toExportPlain(subject: SubjectAttributes) {
    const ability =
      this.environment.shells.length > 0
        ? this.environment.shells[0].security.defineAbilityForSubject(subject)
        : undefined;

    const envPlain = this.environment.toPlain({ ability });
    const presentationConfigurationPlain = this.presentationConfiguration?.toPlain();
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
      ...(presentationConfigurationPlain
        ? {
            presentationConfiguration: {
              elementDesign: presentationConfigurationPlain.elementDesign,
              defaultComponents: presentationConfigurationPlain.defaultComponents,
            },
          }
        : {}),
    };
  }
}
