import { Environment } from "./environment";

export interface IDigitalProductPassportIdentifiable {
  ownedByOrganization: (organizationId: string) => boolean;
  getEnvironment: () => Environment;
}
