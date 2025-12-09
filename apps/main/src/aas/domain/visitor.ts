import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { Key } from "./common/key";
import { LanguageText } from "./common/language-text";
import { Qualifier } from "./common/qualififiable";
import { Reference } from "./common/reference";
import { ConceptDescription } from "./concept-description";
import { EmbeddedDataSpecification } from "./embedded-data-specification";
import { Extension } from "./extension";
import { Resource } from "./resource";
import { SpecificAssetId } from "./specific-asset-id";
import { AnnotatedRelationshipElement } from "./submodel-base/annotated-relationship-element";
import { Blob } from "./submodel-base/blob";
import { Entity } from "./submodel-base/entity";
import { File } from "./submodel-base/file";
import { MultiLanguageProperty } from "./submodel-base/multi-language-property";
import { Property } from "./submodel-base/property";
import { Range } from "./submodel-base/range";
import { ReferenceElement } from "./submodel-base/reference-element";
import { RelationshipElement } from "./submodel-base/relationship-element";
import { Submodel } from "./submodel-base/submodel";
import { SubmodelElementCollection } from "./submodel-base/submodel-element-collection";
import { SubmodelElementList } from "./submodel-base/submodel-element-list";

export interface IVisitor<ContextT, R> {
  visitAdministrativeInformation: (element: AdministrativeInformation, context?: ContextT) => R;
  visitKey: (element: Key, context?: ContextT) => R;
  visitLanguageText: (element: LanguageText, context?: ContextT) => R;
  visitQualifier: (element: Qualifier, context?: ContextT) => R;
  visitReference: (element: Reference, context?: ContextT) => R;
  visitAnnotatedRelationshipElement: (element: AnnotatedRelationshipElement, context?: ContextT) => R;
  visitBlob: (element: Blob, context?: ContextT) => R;
  visitEntity: (element: Entity, context?: ContextT) => R;
  visitFile: (element: File, context?: ContextT) => R;
  visitMultiLanguageProperty: (element: MultiLanguageProperty, context?: ContextT) => R;
  visitProperty: (element: Property, context?: ContextT) => R;
  visitRange: (element: Range, context?: ContextT) => R;
  visitReferenceElement: (element: ReferenceElement, context?: ContextT) => R;
  visitRelationshipElement: (element: RelationshipElement, context?: ContextT) => R;
  visitSubmodel: (element: Submodel, context?: ContextT) => R;
  visitSubmodelElementCollection: (element: SubmodelElementCollection, context?: ContextT) => R;
  visitSubmodelElementList: (element: SubmodelElementList, context?: ContextT) => R;
  visitEmbeddedDataSpecification: (element: EmbeddedDataSpecification, context?: ContextT) => R;
  visitExtension: (element: Extension, context?: ContextT) => R;
  visitSpecificAssetId: (element: SpecificAssetId, context?: ContextT) => R;
  visitAssetAdministrationShell: (element: AssetAdministrationShell, context?: ContextT) => R;
  visitAssetInformation: (element: AssetInformation, context?: ContextT) => R;
  visitResource: (element: Resource, context?: ContextT) => R;
  visitConceptDescription: (element: ConceptDescription, context?: ContextT) => R;
}

export interface IVisitable {
  accept: <ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT) => R;
}
