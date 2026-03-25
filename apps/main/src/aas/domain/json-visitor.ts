import type { AssetAdministrationShell } from "./asset-adminstration-shell";
import type { AssetInformation } from "./asset-information";
import type { AdministrativeInformation } from "./common/administrative-information";
import type { Key } from "./common/key";
import type { LanguageText } from "./common/language-text";
import type { Qualifier } from "./common/qualififiable";
import type { Reference } from "./common/reference";
import type { ConceptDescription } from "./concept-description";
import type { EmbeddedDataSpecification } from "./embedded-data-specification";
import type { Extension } from "./extension";
import type { Resource } from "./resource";
import type { SpecificAssetId } from "./specific-asset-id";
import type { AnnotatedRelationshipElement } from "./submodel-base/annotated-relationship-element";
import type { Blob } from "./submodel-base/blob";
import type { Entity } from "./submodel-base/entity";
import type { File } from "./submodel-base/file";
import type { MultiLanguageProperty } from "./submodel-base/multi-language-property";
import type { Property } from "./submodel-base/property";
import type { Range } from "./submodel-base/range";
import type { ReferenceElement } from "./submodel-base/reference-element";
import type { RelationshipElement } from "./submodel-base/relationship-element";
import type { Submodel } from "./submodel-base/submodel";
import type { SubmodelElementCollection } from "./submodel-base/submodel-element-collection";
import type { SubmodelElementList } from "./submodel-base/submodel-element-list";
import type { IVisitor } from "./visitor";
import { KeyTypes, Permissions } from "@open-dpp/dto";
import { ConvertToPlainOptions } from "./convertable-to-plain";
import { IdShortPath, ISubmodelBase } from "./submodel-base/submodel-base";

interface ContextType { idShortPath: IdShortPath }
export class JsonVisitor implements IVisitor<ContextType, any> {
  constructor(private readonly options?: ConvertToPlainOptions) {
  }

  private buildBase(submodelBase: ISubmodelBase) {
    return {
      category: submodelBase.category,
      idShort: submodelBase.idShort,
      displayName: submodelBase.displayName.map(lt => lt.accept(this)),
      description: submodelBase.description.map(lt => lt.accept(this)),
      semanticId: submodelBase.semanticId?.accept(this) ?? null,
      supplementalSemanticIds: submodelBase.supplementalSemanticIds.map(s => s.accept(this)),
      qualifiers: submodelBase.qualifiers.map(q => q.accept(this)),
      embeddedDataSpecifications: submodelBase.embeddedDataSpecifications.map(e => e.accept(this)),
    };
  }

  private filterByAbility(plainToFilter: any, element: any, context?: ContextType): any {
    const idShortPath = context ? context.idShortPath.addPathSegment(element.idShort) : IdShortPath.create({ path: element.idShort });
    if (this.options?.ability) {
      if (!this.options.ability.can(Permissions.Read, idShortPath)) {
        return { };
      }
    }
    return plainToFilter;
  }

  private removeEmptyItems(items: any[]): any[] {
    return items.filter(item => Object.keys(item).length > 0);
  }

  visitProperty(element: Property, context?: ContextType): any {
    return this.filterByAbility({
      modelType: KeyTypes.Property,
      ...this.buildBase(element),
      extensions: element.extensions.map(e => e.accept(this)),
      valueType: element.valueType,
      value: element.value,
      valueId: element.valueId?.accept(this) ?? null,
    }, element, context);
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
      referredSemanticId: element.referredSemanticId?.accept(this) ?? null,
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
      semanticId: element.semanticId?.accept(this) ?? null,
      supplementalSemanticIds: element.supplementalSemanticIds.map(s => s.accept(this)),
      kind: element.kind,
      value: element.value,
      valueId: element.valueId?.accept(this) ?? null,
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
      semanticId: element.semanticId?.accept(this) ?? null,
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
      administration: element.administration?.accept(this) ?? null,
      kind: element.kind,
      submodelElements: this.removeEmptyItems(element.submodelElements.map(e => e.accept(this, { idShortPath: IdShortPath.create({ path: element.idShort }) }))),
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
      value: element.value ? element.value.toString() : element.value,
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

  visitMultiLanguageProperty(element: MultiLanguageProperty, context?: ContextType): any {
    return this.filterByAbility({
      ...this.buildBase(element),
      modelType: KeyTypes.MultiLanguageProperty,
      extensions: element.extensions.map(e => e.accept(this)),
      value: element.value.map(lt => lt.accept(this)),
      valueId: element.valueId?.accept(this) ?? null,
    }, element, context);
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
      value: element.value?.accept(this) ?? null,
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
    const idShortPath = IdShortPath.create({ path: element.idShort });
    return {
      ...this.buildBase(element),
      modelType: KeyTypes.SubmodelElementCollection,
      extensions: element.extensions.map(e => e.accept(this)),
      value: this.removeEmptyItems(element.value.map(e => e.accept(this, { idShortPath }))),
    };
  }

  visitSubmodelElementList(element: SubmodelElementList): any {
    return {
      ...this.buildBase(element),
      modelType: KeyTypes.SubmodelElementList,
      extensions: element.extensions.map(e => e.accept(this)),
      orderRelevant: element.orderRelevant,
      semanticIdListElement: element.semanticIdListElement?.accept(this) ?? null,
      valueTypeListElement: element.valueTypeListElement,
      typeValueListElement: element.typeValueListElement,
      value: element.value.map(e => e.accept(this)),
    };
  }

  visitSpecificAssetId(element: SpecificAssetId): any {
    return {
      name: element.name,
      value: element.value,
      semanticId: element.semanticId?.accept(this) ?? null,
      supplementalSemanticIds: element.supplementalSemanticIds.map(s => s.accept(this)),
      externalSubjectId: element.externalSubjectId?.accept(this) ?? null,
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
      administration: element.administration?.accept(this) ?? null,
      embeddedDataSpecifications: element.embeddedDataSpecifications.map(e => e.accept(this)),
      derivedFrom: element.derivedFrom?.accept(this) ?? null,
      submodels: element.submodels.map(s => s.accept(this)),
      security: element.security.toPlain(this.options),
    };
  }

  visitAssetInformation(element: AssetInformation): any {
    return {
      assetKind: element.assetKind,
      globalAssetId: element.globalAssetId,
      specificAssetIds: element.specificAssetIds.map(s => s.accept(this)),
      assetType: element.assetType,
      defaultThumbnails: element.defaultThumbnails.map(d => d.accept(this)),
    };
  }

  visitResource(element: Resource): any {
    return {
      path: element.path,
      contentType: element.contentType,
    };
  }

  visitConceptDescription(element: ConceptDescription): any {
    return {
      id: element.id,
      extensions: element.extensions.map(e => e.accept(this)),
      category: element.category,
      idShort: element.idShort,
      displayName: element.displayName.map(lt => lt.accept(this)),
      description: element.description.map(lt => lt.accept(this)),
      semanticId: element.semanticId?.accept(this) ?? null,
      administration: element.administration?.accept(this) ?? null,
      embeddedDataSpecifications: element.embeddedDataSpecifications.map(e => e.accept(this)),
      isCaseOf: element.isCaseOf.map(s => s.accept(this)),
    };
  }
}
