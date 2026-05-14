import { ActivityTypes } from "./activity-types";
import { registerActivity } from "./activity-registry";
import { SubmodelCreateActivity } from "./aas/asset-administration-shell/submodel-create.activity";
import { SubmodelActivity } from "./aas/submodel.activity";
import { AssetAdministrationShellActivity } from "./aas/asset-administration-shell.activity";

export function registerActivityEventClasses(): void {
  registerActivity(ActivityTypes.SubmodelCreate, SubmodelCreateActivity);
  registerActivity(ActivityTypes.SubmodelActivity, SubmodelActivity);
  registerActivity(
    ActivityTypes.AssetAdministrationShellActivity,
    AssetAdministrationShellActivity,
  );
}
