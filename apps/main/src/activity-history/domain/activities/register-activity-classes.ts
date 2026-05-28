import { ActivityTypes } from "./activity-types";
import { registerActivity } from "./activity-registry";
import { SubmodelElementModifiedActivity } from "./submodel-element-modified.activity";
import { RowAddedActivity } from "./row-added.activity";
import { SubmodelElementAddedActivity } from "./submodel-element-added.activity";
import { SubmodelElementDeletedActivity } from "./submodel-element-deleted.activity";

export function registerActivityClasses(): void {
  registerActivity(ActivityTypes.SubmodelElementModified, SubmodelElementModifiedActivity);
  registerActivity(ActivityTypes.SubmodelElementAdded, SubmodelElementAddedActivity);
  registerActivity(ActivityTypes.SubmodelElementDeleted, SubmodelElementDeletedActivity);
  registerActivity(ActivityTypes.RowAdded, RowAddedActivity);
}
