import { Environment } from "../../aas/domain/environment";

export interface IDigitalProductDocument {
  id: string;
  getOrganizationId: () => string;
  getEnvironment: () => Environment;
}
