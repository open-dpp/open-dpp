import { KeyTypes } from "../common/key-types-enum";
import { AnnotatedRelationshipElement } from "./annotated-relationship-element";
import { Blob } from "./blob";
import { Entity } from "./entity";
import { File } from "./file";
import { MultiLanguageProperty } from "./multi-language-property";
import { Property } from "./property";
import { Range } from "./range";
import { ReferenceElement } from "./reference-element";
import { RelationshipElement } from "./relationship-element";
import { Submodel } from "./submodel";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { SubmodelElementList } from "./submodel-element-list";
import { registerSubmodel } from "./submodel-registry";

export function registerSubmodelClasses(): void {
  registerSubmodel(KeyTypes.AnnotatedRelationshipElement, AnnotatedRelationshipElement);
  registerSubmodel(KeyTypes.Blob, Blob);
  registerSubmodel(KeyTypes.Entity, Entity);
  registerSubmodel(KeyTypes.File, File);
  registerSubmodel(KeyTypes.MultiLanguageProperty, MultiLanguageProperty);
  registerSubmodel(KeyTypes.Property, Property);
  registerSubmodel(KeyTypes.Range, Range);
  registerSubmodel(KeyTypes.ReferenceElement, ReferenceElement);
  registerSubmodel(KeyTypes.RelationshipElement, RelationshipElement);
  registerSubmodel(KeyTypes.Submodel, Submodel);
  registerSubmodel(KeyTypes.SubmodelElementCollection, SubmodelElementCollection);
  registerSubmodel(KeyTypes.SubmodelElementList, SubmodelElementList);
}
