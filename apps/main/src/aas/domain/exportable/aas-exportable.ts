import { DigitalProductDocumentTypesType } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { LatestAasExportVersion } from "../../infrastructure/serialization/export-schemas/aas-export-shared";
import { ExpandedEnvironment } from "../expanded-environment";
import { SubjectAttributes } from "../security/subject-attributes";
import { DigitalProductDocumentStatusChange } from "../../../digital-product-document/domain/digital-product-document-status";

export interface AasExportable {
  readonly id: string;
  readonly organizationId: string;
  readonly environment: ExpandedEnvironment;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastStatusChange: DigitalProductDocumentStatusChange;
  readonly presentationConfiguration: PresentationConfiguration | null;
  toExportPlain(subject: SubjectAttributes): Record<string, unknown>;
}

/**
 * Shared base for the two concrete exportables (TemplateExportable, PassportExportable) —
 * factors out everything about `toExportPlain()` that's identical between them, leaving only
 * the entity-specific fields (e.g. passportEditingMode vs editingMode) to the subclass.
 */
export abstract class BaseAasExportable implements AasExportable {
  private readonly EXPORT_FORMAT = "open-dpp:json";
  private readonly EXPORT_VERSION = LatestAasExportVersion;

  protected constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly environment: ExpandedEnvironment,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lastStatusChange: DigitalProductDocumentStatusChange,
    public readonly presentationConfiguration: PresentationConfiguration | null,
    private readonly referenceType: DigitalProductDocumentTypesType,
  ) {
    this.assertConfigMatches();
  }

  protected abstract exportSpecificFields(): Record<string, unknown>;

  private assertConfigMatches(): void {
    if (!this.presentationConfiguration) return;
    if (this.presentationConfiguration.referenceType !== this.referenceType) {
      throw new ValueError(
        `PresentationConfiguration referenceType ${this.presentationConfiguration.referenceType} does not match expected ${this.referenceType}`,
      );
    }
    if (this.presentationConfiguration.referenceId !== this.id) {
      throw new ValueError(
        `PresentationConfiguration referenceId ${this.presentationConfiguration.referenceId} does not match expected ${this.id}`,
      );
    }
  }

  toExportPlain(subject: SubjectAttributes): Record<string, unknown> {
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
      lastStatusChange: this.lastStatusChange.toPlain(),
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
      ...this.exportSpecificFields(),
    };
  }
}
