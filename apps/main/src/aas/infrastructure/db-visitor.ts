import { btoa } from "node:buffer";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { AssetInformation } from "../domain/asset-information";
import { AdministrativeInformation } from "../domain/common/administrative-information";
import { Key } from "../domain/common/key";
import { KeyTypes } from "../domain/common/key-types-enum";
import { LanguageText } from "../domain/common/language-text";
import { Qualifier } from "../domain/common/qualififiable";
import { Reference } from "../domain/common/reference";
import { EmbeddedDataSpecification } from "../domain/embedded-data-specification";
import { Extension } from "../domain/extension";
import { Resource } from "../domain/resource";
import { SpecificAssetId } from "../domain/specific-asset-id";
import { AnnotatedRelationshipElement } from "../domain/submodel-base/annotated-relationship-element";
import { Blob } from "../domain/submodel-base/blob";
import { Entity } from "../domain/submodel-base/entity";
import { File } from "../domain/submodel-base/file";
import { MultiLanguageProperty } from "../domain/submodel-base/multi-language-property";
import { Property } from "../domain/submodel-base/property";
import { Range } from "../domain/submodel-base/range";
import { ReferenceElement } from "../domain/submodel-base/reference-element";
import { RelationshipElement } from "../domain/submodel-base/relationship-element";
import { Submodel } from "../domain/submodel-base/submodel";
import { SubmodelBase } from "../domain/submodel-base/submodel-base";
import { SubmodelElementCollection } from "../domain/submodel-base/submodel-element-collection";
import { SubmodelElementList } from "../domain/submodel-base/submodel-element-list";
import { IVisitor } from "../domain/visitor";

export class DbVisitor implements IVisitor<any> {
  private buildBase(submodelBase: SubmodelBase) {
    return {
      category: submodelBase.category,
      idShort: submodelBase.idShort,
      displayName: submodelBase.displayName.map(lt => lt.accept(this)),
      description: submodelBase.description.map(lt => lt.accept(this)),
      semanticId: submodelBase.semanticId?.accept(this),
      supplementalSemanticIds: submodelBase.supplementalSemanticIds.map(s => s.accept(this)),
      qualifiers: submodelBase.qualifiers.map(q => q.accept(this)),
      embeddedDataSpecifications: submodelBase.embeddedDataSpecifications.map(e => e.accept(this)),
    };
  }

  visitProperty(element: Property): any {
    return {
      modelType: KeyTypes.Property,
      ...this.buildBase(element),
      extensions: element.extensions.map(e => e.accept(this)),
      valueType: element.valueType,
      value: element.value,
      valueId: element.valueId?.accept(this),
    };
  }

  visitLanguageText(element: LanguageText): any {
    return {
      language: element.language,
      text: element.text,
    };
  }

  visitReference(element: Reference): any {
    return {
      type: element.type,
      referredSemanticId: element.referredSemanticId?.accept(this),
      keys: element.keys.map(key => key.accept(this)),
    };
  }

  visitKey(element: Key): any {
    return {
      type: element.type,
      value: element.value,
    };
  }

  visitQualifier(element: Qualifier): any {
    return {
      type: element.type,
      valueType: element.valueType,
      semanticId: element.semanticId?.accept(this),
      supplementalSemanticIds: element.supplementalSemanticIds.map(s => s.accept(this)),
      kind: element.kind,
      value: element.value,
      valueId: element.valueId?.accept(this),
    };
  }

  visitEmbeddedDataSpecification(element: EmbeddedDataSpecification): any {
    return {
      dataSpecification: element.dataSpecification.accept(this),
    };
  }

  visitExtension(element: Extension): any {
    return {
      name: element.name,
      semanticId: element.semanticId?.accept(this),
      supplementalSemanticIds: element.supplementalSemanticIds.map(s => s.accept(this)),
      valueType: element.valueType,
      value: element.value,
      refersTo: element.refersTo.map(r => r.accept(this)),
    };
  }

  visitSubmodel(element: Submodel): any {
    return {
      ...this.buildBase(element),
      modelType: KeyTypes.Submodel,
      id: element.id,
      extensions: element.extensions.map(e => e.accept(this)),
      administration: element.administration.accept(this),
      kind: element.kind,
      submodelElements: element.submodelElements.map(e => e.accept(this)),
    };
  }

  visitAdministrativeInformation(element: AdministrativeInformation): any {
    return {
      version: element.version,
      revision: element.revision,
    };
  }

  visitAnnotatedRelationshipElement(element: AnnotatedRelationshipElement): any {
    return {
      ...this.buildBase(element),
      modelType: KeyTypes.AnnotatedRelationshipElement,
      first: element.first.accept(this),
      second: element.second.accept(this),
      extensions: element.extensions.map(e => e.accept(this)),
      annotations: element.annotations.map(a => a.accept(this)),
    };
  }

  visitBlob(element: Blob): any {
    return {
      ...this.buildBase(element),
      modelType: KeyTypes.Blob,
      contentType: element.contentType,
      extensions: element.extensions.map(e => e.accept(this)),
      value: element.value
        ? btoa(Array.from(element.value)
            .map(byte => String.fromCharCode(byte))
            .join(""),
          )
        : null,
    };
  }

  visitEntity(element: Entity): any {
    return {
      ...this.buildBase(element),
      modelType: KeyTypes.Entity,
      entityType: element.entityType,
      extensions: element.extensions.map(e => e.accept(this)),
      statements: element.statements.map(s => s.accept(this)),
      globalAssetId: element.globalAssetId,
      specificAssetIds: element.specificAssetIds.map(s => s.accept(this)),
    };
  }

  visitFile(element: File): any {
    return {
      ...this.buildBase(element),
      modelType: KeyTypes.File,
      contentType: element.contentType,
      extensions: element.extensions.map(e => e.accept(this)),
      value: element.value,
    };
  }

  visitMultiLanguageProperty(element: MultiLanguageProperty): any {
    return {
      ...this.buildBase(element),
      modelType: KeyTypes.MultiLanguageProperty,
      extensions: element.extensions.map(e => e.accept(this)),
      value: element.value.map(lt => lt.accept(this)),
      valueId: element.valueId?.accept(this),
    };
  }

  visitRange(element: Range): any {
    return {
      ...this.buildBase(element),
      modelType: KeyTypes.Range,
      valueType: element.valueType,
      extensions: element.extensions.map(e => e.accept(this)),
      min: element.min,
      max: element.max,
    };
  }

  visitReferenceElement(element: ReferenceElement): any {
    return {
      ...this.buildBase(element),
      modelType: KeyTypes.ReferenceElement,
      extensions: element.extensions.map(e => e.accept(this)),
      value: element.value?.accept(this),
    };
  }

  visitRelationshipElement(element: RelationshipElement): any {
    return {
      ...this.buildBase(element),
      modelType: KeyTypes.RelationshipElement,
      first: element.first.accept(this),
      second: element.second.accept(this),
      extensions: element.extensions.map(e => e.accept(this)),
    };
  }

  visitSubmodelElementCollection(element: SubmodelElementCollection): any {
    return {
      ...this.buildBase(element),
      modelType: KeyTypes.SubmodelElementCollection,
      extensions: element.extensions.map(e => e.accept(this)),
      value: element.value.map(e => e.accept(this)),
    };
  }

  visitSubmodelElementList(element: SubmodelElementList): any {
    return {
      ...this.buildBase(element),
      modelType: KeyTypes.SubmodelElementList,
      extensions: element.extensions.map(e => e.accept(this)),
      orderRelevant: element.orderRelevant,
      semanticIdListElement: element.semanticIdListElement?.accept(this),
      valueTypeListElement: element.valueTypeListElement,
      value: element.value.map(e => e.accept(this)),
    };
  }

  visitSpecificAssetId(element: SpecificAssetId): any {
    return {
      name: element.name,
      value: element.value,
      semanticId: element.semanticId?.accept(this),
      supplementalSemanticIds: element.supplementalSemanticIds.map(s => s.accept(this)),
      externalSubjectId: element.externalSubjectId?.accept(this),
    };
  }

  visitAssetAdministrationShell(element: AssetAdministrationShell): any {
    return {
      id: element.id,
      assetInformation: element.assetInformation.accept(this),
      extensions: element.extensions.map(e => e.accept(this)),
      category: element.category,
      idShort: element.idShort,
      displayName: element.displayName.map(lt => lt.accept(this)),
      description: element.description.map(lt => lt.accept(this)),
      administration: element.administration?.accept(this),
      embeddedDataSpecifications: element.embeddedDataSpecifications.map(e => e.accept(this)),
      derivedFrom: element.derivedFrom?.accept(this),
      submodels: element.submodels.map(s => s.accept(this)),
    };
  }

  visitAssetInformation(element: AssetInformation): any {
    return {
      assetKind: element.assetKind,
      globalAssetId: element.globalAssetId,
      specificAssetIds: element.specificAssetIds.map(s => s.accept(this)),
      assetType: element.assetType,
      defaultThumbnail: element.defaultThumbnail?.accept(this),
    };
  }

  visitResource(element: Resource): any {
    return {
      path: element.path,
      contentType: element.contentType,
    };
  }
}
