import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { KeyTypes } from "./common/key";
import { ConceptDescription } from "./concept-description";
import { AnnotatedRelationshipElement } from "./submodelBase/annotated-relationship-element";
import { Entity } from "./submodelBase/entity";
import { MultiLanguageProperty } from "./submodelBase/multi-language-property";
import { Property } from "./submodelBase/property";
import { Range } from "./submodelBase/range";
import { ReferenceElement } from "./submodelBase/reference-element";
import { RelationshipElement } from "./submodelBase/relationship-element";
import { ISubmodelBase, Submodel } from "./submodelBase/submodel";
import { SubmodelElementCollection } from "./submodelBase/submodel-element-collection";
import { SubmodelElementList } from "./submodelBase/submodel-element-list";

const submodelBaseClassMappings = [
  { value: AnnotatedRelationshipElement, name: KeyTypes.AnnotatedRelationshipElement },
  { value: Blob, name: KeyTypes.Blob },
  { value: ConceptDescription, name: KeyTypes.ConceptDescription },
  { value: Entity, name: KeyTypes.Entity },
  { value: File, name: KeyTypes.File },
  { value: MultiLanguageProperty, name: KeyTypes.MultiLanguageProperty },
  { value: Property, name: KeyTypes.Property },
  { value: Range, name: KeyTypes.Range },
  { value: ReferenceElement, name: KeyTypes.ReferenceElement },
  { value: RelationshipElement, name: KeyTypes.RelationshipElement },
  { value: Submodel, name: KeyTypes.Submodel },
  { value: SubmodelElementCollection, name: KeyTypes.SubmodelElementCollection },
  { value: SubmodelElementList, name: KeyTypes.SubmodelElementList },
];

const aasClassMappings = [
  ...submodelBaseClassMappings,
  { value: AssetAdministrationShell, name: KeyTypes.AssetAdministrationShell },
];

export function getSubmodelBaseName(submodelBaseInstance: ISubmodelBase): KeyTypes {
  const name = submodelBaseClassMappings.find(mapping => submodelBaseInstance instanceof mapping.value)?.name;
  if (!name) {
    throw new Error(`Could not find name for submodel base class ${submodelBaseInstance.constructor.name}`);
  }
  return name;
}
