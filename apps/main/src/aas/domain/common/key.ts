export class Key {
  private constructor(public type: KeyTypes, public value: string) {
  }

  static create(data: {
    type: KeyTypes;
    value: string;
  }) {
    return new Key(data.type, data.value);
  }
}

export enum KeyTypes {
  AnnotatedRelationshipElement = "AnnotatedRelationshipElement",
  AssetAdministrationShell = "AssetAdministrationShell",
  BasicEventElement = "BasicEventElement",
  Blob = "Blob",
  Capability = "Capability",
  ConceptDescription = "ConceptDescription",
  DataElement = "DataElement",
  Entity = "Entity",
  EventElement = "EventElement",
  File = "File",
  FragmentReference = "FragmentReference",
  GlobalReference = "GlobalReference",
  Identifiable = "Identifiable",
  MultiLanguageProperty = "MultiLanguageProperty",
  Operation = "Operation",
  Property = "Property",
  Range = "Range",
  Referable = "Referable",
  ReferenceElement = "ReferenceElement",
  RelationshipElement = "RelationshipElement",
  Submodel = "Submodel",
  SubmodelElement = "SubmodelElement",
  SubmodelElementCollection = "SubmodelElementCollection",
  SubmodelElementList = "SubmodelElementList",
}
