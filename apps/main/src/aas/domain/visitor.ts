import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { Key } from "./common/key";
import { LanguageText } from "./common/language-text";
import { Qualifier } from "./common/qualififiable";
import { Reference } from "./common/reference";
import { EmbeddedDataSpecification } from "./embedded-data-specification";
import { Extension } from "./extension";
import { Resource } from "./resource";
import { SpecificAssetId } from "./specific-asset-id";
import { AnnotatedRelationshipElement } from "./submodelBase/annotated-relationship-element";
import { Blob } from "./submodelBase/blob";
import { Entity } from "./submodelBase/entity";
import { File } from "./submodelBase/file";
import { MultiLanguageProperty } from "./submodelBase/multi-language-property";
import { Property } from "./submodelBase/property";
import { Range } from "./submodelBase/range";
import { ReferenceElement } from "./submodelBase/reference-element";
import { RelationshipElement } from "./submodelBase/relationship-element";
import { Submodel } from "./submodelBase/submodel";
import { SubmodelElementCollection } from "./submodelBase/submodel-element-collection";
import { SubmodelElementList } from "./submodelBase/submodel-element-list";

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
}

export interface IVisitable<R> {
  accept: (visitor: IVisitor<R>) => R;
}
