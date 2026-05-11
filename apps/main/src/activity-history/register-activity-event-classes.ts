import { ActivityTypes } from "./activity-types";
import { SubmodelElementModificationActivity } from "./aas/submodel-base/submodel-element-modification.activity";
import { registerActivity } from "./activity-registry";
import { SubmodelElementValueModificationActivity } from "./aas/submodel-base/submodel-element-value-modification.activity";
import { SubmodelModificationActivity } from "./aas/submodel-base/submodel-modification.activity";
import { SubmodelColumnModificationActivity } from "./aas/submodel-base/submodel-column-modification.activity";
import { AssetAdministrationShellModificationActivity } from "./aas/asset-administration-shell-modification.activity";
import { SubmodelElementCreateActivity } from "./aas/submodel-base/submodel-element-create.activity";

export function registerActivityEventClasses(): void {
  registerActivity(ActivityTypes.SubmodelModification, SubmodelModificationActivity);
  registerActivity(ActivityTypes.SubmodelElementModification, SubmodelElementModificationActivity);
  registerActivity(
    ActivityTypes.SubmodelElementValueModification,
    SubmodelElementValueModificationActivity,
  );
  registerActivity(ActivityTypes.SubmodelColumnModification, SubmodelColumnModificationActivity);
  registerActivity(
    ActivityTypes.AssetAdministrationShellModification,
    AssetAdministrationShellModificationActivity,
  );
  registerActivity(ActivityTypes.SubmodelElementCreate, SubmodelElementCreateActivity);
}
