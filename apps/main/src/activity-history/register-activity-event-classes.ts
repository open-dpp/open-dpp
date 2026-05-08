import { ActivityTypes } from "./activity-types";
import { SubmodelElementModificationActivity } from "./aas/submodel-base/submodel-element-modification.activity";
import { registerActivity } from "./activity-registry";
import { SubmodelElementValueModificationActivity } from "./aas/submodel-base/submodel-element-value-modification.activity";

export function registerActivityEventClasses(): void {
  registerActivity(ActivityTypes.SubmodelElementModification, SubmodelElementModificationActivity);
  registerActivity(
    ActivityTypes.SubmodelElementValueModification,
    SubmodelElementValueModificationActivity,
  );
}
