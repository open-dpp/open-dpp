import { ActivityTypes } from "./activity-types";
import { registerActivity } from "./activity-registry";
import { SubmodelElementCreateActivity } from "./aas/submodel-base/submodel-element-create.activity";
import { SubmodelColumnCreateActivity } from "./aas/submodel-base/submodel-column-create.activity";
import { SubmodelRowCreateActivity } from "./aas/submodel-base/submodel-row-create.activity";
import { SubmodelCreateActivity } from "./aas/asset-administration-shell/submodel-create.activity";
import { SubmodelActivity } from "./aas/submodel.activity";
import { AssetAdministrationShellActivity } from "./aas/asset-administration-shell.activity";

export function registerActivityEventClasses(): void {
  registerActivity(ActivityTypes.SubmodelElementCreate, SubmodelElementCreateActivity);
  registerActivity(ActivityTypes.SubmodelColumnCreate, SubmodelColumnCreateActivity);
  registerActivity(ActivityTypes.SubmodelRowCreate, SubmodelRowCreateActivity);
  registerActivity(ActivityTypes.SubmodelCreate, SubmodelCreateActivity);
  registerActivity(ActivityTypes.SubmodelActivity, SubmodelActivity);
  registerActivity(
    ActivityTypes.AssetAdministrationShellActivity,
    AssetAdministrationShellActivity,
  );
}
