import { ActivityTypes } from "./activity-types";
import { registerActivity } from "./activity-registry";
import { SubmodelElementModifiedActivity } from "./submodel-element-modified.activity";
import { RowAddedActivity } from "./row-added.activity";
import { SubmodelElementAddedActivity } from "./submodel-element-added.activity";
import { SubmodelElementDeletedActivity } from "./submodel-element-deleted.activity";
import { SubmodelModifiedActivity } from "./submodel-modified.activity";
import { SubmodelValueModifiedActivity } from "./submodel-value-modified.activity";
import { SubmodelElementValueModifiedActivity } from "./submodel-element-value-modified.activity";
import { AssetAdministrationShellModifiedActivity } from "./asset-administration-shell-modified.activity";
import { PolicyDeletedActivity } from "./policy-deleted.activity";
import { ColumnAddedActivity } from "./column-added.activity";
import { ColumnModifiedActivity } from "./column-modified.activity";
import { ColumnDeletedActivity } from "./column-deleted.activity";
import { RowDeletedActivity } from "./row-deleted.activity";
import { SubmodelAddedActivity } from "./submodel-added.activity";
import { SubmodelDeletedActivity } from "./submodel-deleted.activity";

export function registerActivityClasses(): void {
  registerActivity(ActivityTypes.SubmodelAdded, SubmodelAddedActivity);
  registerActivity(ActivityTypes.SubmodelDeleted, SubmodelDeletedActivity);
  registerActivity(ActivityTypes.SubmodelModified, SubmodelModifiedActivity);
  registerActivity(ActivityTypes.SubmodelValueModified, SubmodelValueModifiedActivity);
  registerActivity(
    ActivityTypes.SubmodelElementValueModified,
    SubmodelElementValueModifiedActivity,
  );
  registerActivity(ActivityTypes.SubmodelElementModified, SubmodelElementModifiedActivity);
  registerActivity(ActivityTypes.SubmodelElementAdded, SubmodelElementAddedActivity);
  registerActivity(ActivityTypes.SubmodelElementDeleted, SubmodelElementDeletedActivity);
  registerActivity(
    ActivityTypes.AssetAdministrationShellModified,
    AssetAdministrationShellModifiedActivity,
  );
  registerActivity(ActivityTypes.PolicyDeleted, PolicyDeletedActivity);
  registerActivity(ActivityTypes.RowAdded, RowAddedActivity);
  registerActivity(ActivityTypes.ColumnAdded, ColumnAddedActivity);
  registerActivity(ActivityTypes.RowDeleted, RowDeletedActivity);
  registerActivity(ActivityTypes.ColumnModified, ColumnModifiedActivity);
  registerActivity(ActivityTypes.ColumnDeleted, ColumnDeletedActivity);
}
