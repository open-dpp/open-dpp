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

export interface IVisitor<R> {
  visitAdministrativeInformation: (element: AdministrativeInformation) => R;
  visitKey: (element: Key) => R;
  visitLanguageText: (element: LanguageText) => R;
  visitQualifier: (element: Qualifier) => R;
  visitReference: (element: Reference) => R;
  visitAnnotatedRelationshipElement: (element: AnnotatedRelationshipElement) => R;
  visitBlob: (element: Blob) => R;
  visitEntity: (element: Entity) => R;
  visitFile: (element: File) => R;
  visitMultiLanguageProperty: (element: MultiLanguageProperty) => R;
  visitProperty: (element: Property) => R;
  visitRange: (element: Range) => R;
  visitReferenceElement: (element: ReferenceElement) => R;
  visitRelationshipElement: (element: RelationshipElement) => R;
  visitSubmodel: (element: Submodel) => R;
  visitSubmodelElementCollection: (element: SubmodelElementCollection) => R;
  visitSubmodelElementList: (element: SubmodelElementList) => R;
  visitEmbeddedDataSpecification: (element: EmbeddedDataSpecification) => R;
  visitExtension: (element: Extension) => R;
  visitSpecificAssetId: (element: SpecificAssetId) => R;
  visitAssetAdministrationShell: (element: AssetAdministrationShell) => R;
  visitAssetInformation: (element: AssetInformation) => R;
  visitResource: (element: Resource) => R;
  visitConceptDescription: (element: ConceptDescription) => R;
}

export interface IVisitable<R> {
  accept: (visitor: IVisitor<R>) => R;
}
