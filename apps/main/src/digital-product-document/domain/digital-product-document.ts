import { Environment } from "../../aas/domain/environment";
import { DigitalProductDocumentTypesType } from "@open-dpp/dto";

export interface IDigitalProductDocument {
  id: string;
  getOrganizationId: () => string;
  getEnvironment: () => Environment;
  getType: () => DigitalProductDocumentTypesType;
}
