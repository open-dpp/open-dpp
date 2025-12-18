import { KeyTypes } from "@open-dpp/aas";
import { AnnotatedRelationshipElement } from "./annotated-relationship-element";
import { Blob } from "./blob";
import { Entity } from "./entity";
import { File } from "./file";
import { MultiLanguageProperty } from "./multi-language-property";
import { Property } from "./property";
import { Range } from "./range";
import { ReferenceElement } from "./reference-element";
import { RelationshipElement } from "./relationship-element";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { SubmodelElementList } from "./submodel-element-list";
import { registerSubmodelElement } from "./submodel-registry";

export function registerSubmodelElementClasses(): void {
  registerSubmodelElement(KeyTypes.AnnotatedRelationshipElement, AnnotatedRelationshipElement);
  registerSubmodelElement(KeyTypes.Blob, Blob);
  registerSubmodelElement(KeyTypes.Entity, Entity);
  registerSubmodelElement(KeyTypes.File, File);
  registerSubmodelElement(KeyTypes.MultiLanguageProperty, MultiLanguageProperty);
  registerSubmodelElement(KeyTypes.Property, Property);
  registerSubmodelElement(KeyTypes.Range, Range);
  registerSubmodelElement(KeyTypes.ReferenceElement, ReferenceElement);
  registerSubmodelElement(KeyTypes.RelationshipElement, RelationshipElement);
  registerSubmodelElement(KeyTypes.SubmodelElementCollection, SubmodelElementCollection);
  registerSubmodelElement(KeyTypes.SubmodelElementList, SubmodelElementList);
}
