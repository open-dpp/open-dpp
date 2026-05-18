import { Environment } from "../../aas/domain/environment";
import { IActivity } from "../../activity-history/activity";

export interface IDigitalProductDocument {
  id: string;
  getOrganizationId: () => string;
  getEnvironment: () => Environment;
  pullActivities: (correlationId: string) => Array<IActivity>;
}
