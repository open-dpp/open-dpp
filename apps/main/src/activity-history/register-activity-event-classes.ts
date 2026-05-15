import { ActivityTypes } from "./activity-types";
import { registerActivity } from "./activity-registry";
import { SubmodelActivity } from "./domain/aas/submodel.activity";
import { AssetAdministrationShellActivity } from "./domain/aas/asset-administration-shell.activity";
import { EnvironmentActivity } from "./domain/aas/environment.activity";
import { DigitalProductDocumentActivity } from "./domain/digital-product-document.activity";

export function registerActivityEventClasses(): void {
  registerActivity(ActivityTypes.SubmodelActivity, SubmodelActivity);
  registerActivity(
    ActivityTypes.AssetAdministrationShellActivity,
    AssetAdministrationShellActivity,
  );
  registerActivity(ActivityTypes.EnvironmentActivity, EnvironmentActivity);
  registerActivity(ActivityTypes.DigitalProductDocumentActivity, DigitalProductDocumentActivity);
}
