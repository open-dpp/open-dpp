import { DigitalProductDocumentTypes } from "@open-dpp/dto";
import { DigitalProductDocumentStatusChange } from "../../../digital-product-document/domain/digital-product-document-status";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { Template } from "../../../templates/domain/template";
import { ExpandedEnvironment } from "../expanded-environment";
import { BaseAasExportable } from "./aas-exportable";

export class TemplateExportable extends BaseAasExportable {
  private constructor(
    id: string,
    organizationId: string,
    environment: ExpandedEnvironment,
    createdAt: Date,
    updatedAt: Date,
    lastStatusChange: DigitalProductDocumentStatusChange,
    presentationConfiguration: PresentationConfiguration | null,
  ) {
    super(
      id,
      organizationId,
      environment,
      createdAt,
      updatedAt,
      lastStatusChange,
      presentationConfiguration,
      DigitalProductDocumentTypes.Template,
    );
  }

  static fromTemplate(
    data: Template,
    expandedEnvironment: ExpandedEnvironment,
    presentationConfiguration: PresentationConfiguration | null = null,
  ) {
    return new TemplateExportable(
      data.id,
      data.organizationId,
      expandedEnvironment,
      data.createdAt,
      data.updatedAt,
      data.getLastStatusChange(),
      presentationConfiguration,
    );
  }

  protected exportSpecificFields(): Record<string, unknown> {
    return {};
  }
}
