import { Environment } from "../../aas/domain/environment";
import { IActivity } from "../../activity-history/domain/activities/activity";

export interface IDigitalProductDocument {
  id: string;
  getOrganizationId: () => string;
  getEnvironment: () => Environment;
  pullActivities: (correlationId: string) => Array<IActivity>;
}
