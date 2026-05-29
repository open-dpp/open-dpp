import { ActivityTypes } from "./activity-types";
import { registerActivity } from "./activity-registry";
import { SubmodelElementModifiedActivity } from "./submodel-element-modified.activity";
import { RowAddedActivity } from "./row-added.activity";
import { SubmodelElementAddedActivity } from "./submodel-element-added.activity";
import { SubmodelElementDeletedActivity } from "./submodel-element-deleted.activity";
import { SubmodelModifiedActivity } from "./submodel-modified.activity";
import { SubmodelValueModifiedActivity } from "./submodel-value-modified.activity";
import { SubmodelElementValueModifiedActivity } from "./submodel-element-value-modified.activity";

export function registerActivityClasses(): void {
  registerActivity(ActivityTypes.SubmodelModified, SubmodelModifiedActivity);
  registerActivity(ActivityTypes.SubmodelValueModified, SubmodelValueModifiedActivity);
  registerActivity(
    ActivityTypes.SubmodelElementValueModified,
    SubmodelElementValueModifiedActivity,
  );
  registerActivity(ActivityTypes.SubmodelElementModified, SubmodelElementModifiedActivity);
  registerActivity(ActivityTypes.SubmodelElementAdded, SubmodelElementAddedActivity);
  registerActivity(ActivityTypes.SubmodelElementDeleted, SubmodelElementDeletedActivity);
  registerActivity(ActivityTypes.RowAdded, RowAddedActivity);
}
