import { ActivityTypes } from "./activity-types";
import { registerActivity } from "./activity-registry";
import { SubmodelActivity } from "./aas/submodel.activity";
import { AssetAdministrationShellActivity } from "./aas/asset-administration-shell.activity";
import { EnvironmentActivity } from "./aas/environment.activity";
import { DigitalProductDocumentActivity } from "./aas/digital-product-document.activity";

export function registerActivityEventClasses(): void {
  registerActivity(ActivityTypes.SubmodelActivity, SubmodelActivity);
  registerActivity(
    ActivityTypes.AssetAdministrationShellActivity,
    AssetAdministrationShellActivity,
  );
  registerActivity(ActivityTypes.EnvironmentActivity, EnvironmentActivity);
  registerActivity(ActivityTypes.DigitalProductDocumentActivity, DigitalProductDocumentActivity);
}
