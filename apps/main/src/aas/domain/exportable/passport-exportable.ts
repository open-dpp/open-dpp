import { DigitalProductDocumentTypes } from "@open-dpp/dto";
import { DigitalProductDocumentStatusChange } from "../../../digital-product-document/domain/digital-product-document-status";
import { PassportEditingModeType } from "../../../digital-product-document/domain/passport-editing-mode";
import { Passport } from "../../../passports/domain/passport";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { ExpandedEnvironment } from "../expanded-environment";
import { BaseAasExportable } from "./aas-exportable";

export class PassportExportable extends BaseAasExportable {
  private constructor(
    id: string,
    organizationId: string,
    public readonly templateId: string | null,
    environment: ExpandedEnvironment,
    createdAt: Date,
    updatedAt: Date,
    lastStatusChange: DigitalProductDocumentStatusChange,
    presentationConfiguration: PresentationConfiguration | null,
    public readonly editingMode: PassportEditingModeType,
  ) {
    super(
      id,
      organizationId,
      environment,
      createdAt,
      updatedAt,
      lastStatusChange,
      presentationConfiguration,
      DigitalProductDocumentTypes.Passport,
    );
  }

  static fromPassport(
    data: Passport,
    expandedEnvironment: ExpandedEnvironment,
    presentationConfiguration: PresentationConfiguration | null = null,
  ) {
    return new PassportExportable(
      data.id,
      data.organizationId,
      data.templateId,
      expandedEnvironment,
      data.createdAt,
      data.updatedAt,
      data.getLastStatusChange(),
      presentationConfiguration,
      data.getEditingMode(),
    );
  }

  protected exportSpecificFields(): Record<string, unknown> {
    return { editingMode: this.editingMode };
  }
}
