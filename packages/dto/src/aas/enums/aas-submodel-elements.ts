import { z } from 'zod'

export const AasSubmodelElements = {
  AnnotatedRelationshipElement: 'AnnotatedRelationshipElement',
  BasicEventElement: 'BasicEventElement',
  Blob: 'Blob',
  Capability: 'Capability',
  ConceptDescription: 'ConceptDescription',
  DataElement: 'DataElement',
  Entity: 'Entity',
  EventElement: 'EventElement',
  File: 'File',
  MultiLanguageProperty: 'MultiLanguageProperty',
  Operation: 'Operation',
  Property: 'Property',
  Range: 'Range',
  ReferenceElement: 'ReferenceElement',
  RelationshipElement: 'RelationshipElement',
  SubmodelElement: 'SubmodelElement',
  SubmodelElementList: 'SubmodelElementList',
  SubmodelElementCollection: 'SubmodelElementCollection',
} as const

export const AasSubmodelElementsEnum = z.enum(AasSubmodelElements)
export type AasSubmodelElementsType = z.infer<typeof AasSubmodelElementsEnum>
