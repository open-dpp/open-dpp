import { Buffer } from "node:buffer";
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
import { IVisitor } from "./visitor";

export class ValueVisitor implements IVisitor<any, any> {
  visitAdministrativeInformation(element: AdministrativeInformation, context: any): any {
  }

  visitAnnotatedRelationshipElement(element: AnnotatedRelationshipElement, context: any): any {
  }

  visitAssetAdministrationShell(element: AssetAdministrationShell, context: any): any {
  }

  visitAssetInformation(element: AssetInformation, context: any): any {
  }

  visitBlob(element: Blob, context: any): any {
    return element.value ? { contentType: element.contentType, value: Buffer.from(element.value).toString("utf-8") } : { contentType: element.contentType, value: undefined };
  }

  visitConceptDescription(element: ConceptDescription, context: any): any {
  }

  visitEmbeddedDataSpecification(element: EmbeddedDataSpecification, context: any): any {
  }

  visitEntity(element: Entity, context: any): any {
  }

  visitExtension(element: Extension, context: any): any {
  }

  visitFile(element: File, context: any): any {
    return { contentType: element.contentType, value: element.value };
  }

  visitKey(element: Key, context: any): any {
  }

  visitLanguageText(element: LanguageText, context: any): any {
  }

  visitMultiLanguageProperty(element: MultiLanguageProperty, context: any): any {
    return element.value.map(v => ({
      [v.language]: v.text,
    }));
  }

  visitProperty(element: Property, context: any): any {
    return element.value;
  }

  visitQualifier(element: Qualifier, context: any): any {
  }

  visitRange(element: Range, context: any): any {
    return { min: element.min, max: element.max };
  }

  visitReference(element: Reference, context: any): any {
  }

  visitReferenceElement(element: ReferenceElement, context: any): any {
  }

  visitRelationshipElement(element: RelationshipElement, context: any): any {
  }

  visitResource(element: Resource, context: any): any {
  }

  visitSpecificAssetId(element: SpecificAssetId, context: any): any {
  }

  visitSubmodel(element: Submodel, context: any): any {
    const value: { [key: string]: any } = {};
    for (const submodelElement of element.submodelElements) {
      value[submodelElement.idShort] = submodelElement.accept(this, context);
    }
    return value;
  }

  visitSubmodelElementCollection(element: SubmodelElementCollection, context: any): any {
    const value: { [key: string]: any } = {};
    for (const submodelElement of element.value) {
      value[submodelElement.idShort] = submodelElement.accept(this, context);
    }
    return value;
  }

  visitSubmodelElementList(element: SubmodelElementList, context: any): any {
  }
}
