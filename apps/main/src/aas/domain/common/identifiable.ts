import { AdministrativeInformation } from "./administrative-information";

export interface IIdentifiable {
  id: string;
  administration: AdministrativeInformation | null;
}
