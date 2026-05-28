import { ChangeEventTypes } from "./change-event-types";
import { PropertyValueChanged } from "./property-value-changed";
import { RowAdded } from "./row-added";
import { registerChangeEvent } from "./change-event-registry";
import { SubmodelElementAdded } from "./submodel-element-added";
import { SubmodelElementDeleted } from "./submodel-element-deleted";
import { SubmodelReferenceAdded } from "./submodel-reference-added";
import { DescriptionChanged, DisplayNameChanged } from "./language-text-collection-changed";
import { FileValueChanged } from "./file-value-changed";

export function registerChangeEventClasses(): void {
  registerChangeEvent(ChangeEventTypes.PropertyValueChanged, PropertyValueChanged);
  registerChangeEvent(ChangeEventTypes.FileValueChanged, FileValueChanged);
  registerChangeEvent(ChangeEventTypes.DisplayNameChanged, DisplayNameChanged);
  registerChangeEvent(ChangeEventTypes.DescriptionChanged, DescriptionChanged);
  registerChangeEvent(ChangeEventTypes.RowAdded, RowAdded);
  registerChangeEvent(ChangeEventTypes.SubmodelElementAdded, SubmodelElementAdded);
  registerChangeEvent(ChangeEventTypes.SubmodelElementDeleted, SubmodelElementDeleted);
  registerChangeEvent(ChangeEventTypes.SubmodelReferenceAdded, SubmodelReferenceAdded);
}
