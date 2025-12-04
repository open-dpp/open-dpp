import { Environment } from "./environment";

export interface IDigitalProductPassportIdentifiable {
  getOrganizationId: () => string;
  getEnvironment: () => Environment;
}
