import { ActivityTypes } from "./activity-types";
import { SubmodelElementModificationActivity } from "./aas/submodel-base/submodel-element-modification.activity";
import { registerActivity } from "./activity-registry";

export function registerActivityEventClasses(): void {
  registerActivity(ActivityTypes.SubmodelElementModification, SubmodelElementModificationActivity);
}
