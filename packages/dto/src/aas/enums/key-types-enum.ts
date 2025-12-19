import { z } from 'zod'

export const KeyTypes = {
  AnnotatedRelationshipElement: 'AnnotatedRelationshipElement',
  AssetAdministrationShell: 'AssetAdministrationShell',
  BasicEventElement: 'BasicEventElement',
  Blob: 'Blob',
  Capability: 'Capability',
  ConceptDescription: 'ConceptDescription',
  DataElement: 'DataElement',
  Entity: 'Entity',
  EventElement: 'EventElement',
  File: 'File',
  FragmentReference: 'FragmentReference',
  GlobalReference: 'GlobalReference',
  Identifiable: 'Identifiable',
  MultiLanguageProperty: 'MultiLanguageProperty',
  Operation: 'Operation',
  Property: 'Property',
  Range: 'Range',
  Referable: 'Referable',
  ReferenceElement: 'ReferenceElement',
  RelationshipElement: 'RelationshipElement',
  Submodel: 'Submodel',
  SubmodelElement: 'SubmodelElement',
  SubmodelElementCollection: 'SubmodelElementCollection',
  SubmodelElementList: 'SubmodelElementList',
} as const
export const KeyTypesEnum = z.enum(KeyTypes)
export type KeyTypesType = z.infer<typeof KeyTypesEnum>
