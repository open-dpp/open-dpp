import { IVisitable, IVisitor } from "../visitor";
import { KeyJsonSchema } from "../zod-schemas";

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

export class Key implements IVisitable<any> {
  private constructor(public type: KeyTypes, public value: string) {
  }

  static create(data: {
    type: KeyTypes;
    value: string;
  }) {
    return new Key(data.type, data.value);
  }

  static fromPlain(json: Record<string, unknown>) {
    return Key.create(KeyJsonSchema.parse(json));
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitKey(this);
  }
}
