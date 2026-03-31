import { Buffer } from "node:buffer";
import { Permissions } from "@open-dpp/dto";
import { ForbiddenError, NotSupportedError } from "@open-dpp/exception";
import pickBy from "lodash/pickBy";
import { z } from "zod";
import { isEmptyObject } from "../../utils";
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
import { AasAbility } from "./security/aas-ability";
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
import { IdShortPath } from "./submodel-base/submodel-base";
import { SubmodelElementCollection } from "./submodel-base/submodel-element-collection";
import { SubmodelElementList } from "./submodel-base/submodel-element-list";
import { IVisitor } from "./visitor";

export interface ValueVisitorOptions { ability: AasAbility }
export interface ValueVisitorContextType { fullParentIdShortPath: IdShortPath }

export type JsonType = z.infer<typeof z.json>;
export class ValueVisitor implements IVisitor<ValueVisitorContextType, JsonType> {
  constructor(private readonly options: ValueVisitorOptions) {
  }

  private buildFullIdShortPath(element: any, context?: ValueVisitorContextType) {
    return context ? context.fullParentIdShortPath.addPathSegment(element.idShort) : IdShortPath.create({ path: element.idShort });
  }

  private filterByAbility(plainToFilter: any, element: any, context?: ValueVisitorContextType): any {
    const idShortPath = this.buildFullIdShortPath(element, context);
    if (this.options?.ability) {
      if (!this.options.ability.can(Permissions.Read, idShortPath)) {
        return undefined;
      }
    }
    return plainToFilter;
  }

  private removeUndefined(plainToFilter: any): any {
    return pickBy(plainToFilter, value => value !== undefined);
  }

  visitAdministrativeInformation(_element: AdministrativeInformation, _context: any): JsonType {
    throw new NotSupportedError(
      "AdministrativeInformation is not supported for value serialization.",
    );
  }

  visitAnnotatedRelationshipElement(element: AnnotatedRelationshipElement, context?: ValueVisitorContextType): JsonType {
    return this.filterByAbility({ first: element.first.accept(this, context), second: element.second.accept(this, context) }, element, context);
  }

  visitAssetAdministrationShell(_element: AssetAdministrationShell, _context: any): JsonType {
    throw new NotSupportedError(
      "AssetAdministrationShell is not supported for value serialization.",
    );
  }

  visitAssetInformation(_element: AssetInformation, _context: any): JsonType {
    throw new NotSupportedError(
      "AssetInformation is not supported for value serialization.",
    );
  }

  visitBlob(element: Blob, context?: ValueVisitorContextType): JsonType {
    const plain = element.value ? { contentType: element.contentType, value: Buffer.from(element.value).toString("utf-8") } : { contentType: element.contentType, value: undefined };
    return this.filterByAbility(plain, element, context);
  }

  visitConceptDescription(_element: ConceptDescription, _context: any): JsonType {
    throw new NotSupportedError(
      "ConceptDescription is not supported for value serialization.",
    );
  }

  visitEmbeddedDataSpecification(_element: EmbeddedDataSpecification, _context: any): JsonType {
    throw new NotSupportedError(
      "EmbeddedDataSpecification is not supported for value serialization.",
    );
  }

  visitEntity(element: Entity, context?: ValueVisitorContextType): JsonType {
    const childContext = { fullParentIdShortPath: this.buildFullIdShortPath(element, context) };
    const statements = element.statements.map(st => this.removeUndefined({ [st.idShort]: st.accept(this, childContext) })).filter(s => !isEmptyObject(s));

    const plain = {
      entityType: element.entityType,
      globalAssetId: element.globalAssetId,
      statements,
      specificAssetIds: element.specificAssetIds.map(specificAssetId => specificAssetId.accept(this, childContext)),
    };
    return statements.length > 0 ? plain : this.filterByAbility(plain, element, context);
  }

  visitExtension(_element: Extension, _context: any): JsonType {
    throw new NotSupportedError(
      "Extension is not supported for value serialization.",
    );
  }

  visitFile(element: File, context?: ValueVisitorContextType): JsonType {
    return this.filterByAbility({ contentType: element.contentType, value: element.value }, element, context);
  }

  visitKey(element: Key, _context: any): JsonType {
    return { type: element.type, value: element.value };
  }

  visitLanguageText(element: LanguageText, _context: any): JsonType {
    return { [element.language]: element.text };
  }

  visitMultiLanguageProperty(element: MultiLanguageProperty, context?: ValueVisitorContextType): JsonType {
    const plain = element.value.map(v => v.accept(this, context));
    return this.filterByAbility(plain, element, context);
  }

  visitProperty(element: Property, context?: ValueVisitorContextType): JsonType {
    return this.filterByAbility(element.value, element, context);
  }

  visitQualifier(_element: Qualifier, _context: any): JsonType {
    throw new NotSupportedError(
      "Qualifier is not supported for value serialization.",
    );
  }

  visitRange(element: Range, context?: ValueVisitorContextType): JsonType {
    return this.filterByAbility({ min: element.min, max: element.max }, element, context);
  }

  visitReference(element: Reference, context?: ValueVisitorContextType): JsonType {
    return {
      type: element.type,
      ...(element.referredSemanticId && { referredSemanticId: element.referredSemanticId.accept(this, context) }),
      keys: element.keys.map(key => key.accept(this, context)),
    };
  }

  visitReferenceElement(element: ReferenceElement, context?: ValueVisitorContextType): JsonType {
    const plain = element.value?.accept(this, context) ?? null;

    return this.filterByAbility(plain, element, context);
  }

  visitRelationshipElement(element: RelationshipElement, context?: ValueVisitorContextType): JsonType {
    const plain = { first: element.first.accept(this, context), second: element.second.accept(this, context) };
    return this.filterByAbility(plain, element, context);
  }

  visitResource(_element: Resource, _context: any): JsonType {
    throw new NotSupportedError(
      "Resource is not supported for value serialization.",
    );
  }

  visitSpecificAssetId(element: SpecificAssetId, _context: any): JsonType {
    return {
      [element.name]: element.value,
    };
  }

  visitSubmodel(element: Submodel, context?: ValueVisitorContextType): JsonType {
    const value: { [key: string]: any } = {};
    for (const submodelElement of element.submodelElements) {
      value[submodelElement.idShort] = submodelElement.accept(this, { fullParentIdShortPath: this.buildFullIdShortPath(element, context) });
    }

    const cleaned = this.removeUndefined(value);

    if (isEmptyObject(cleaned) && !this.options.ability?.can(Permissions.Read, IdShortPath.create({ path: element.idShort }))) {
      throw new ForbiddenError(`Cannot access submodel ${element.idShort}`);
    }

    return cleaned;
  }

  visitSubmodelElementCollection(element: SubmodelElementCollection, context?: ValueVisitorContextType): JsonType {
    const value: { [key: string]: any } = {};
    for (const submodelElement of element.value) {
      value[submodelElement.idShort] = submodelElement.accept(this, { fullParentIdShortPath: this.buildFullIdShortPath(element, context) });
    }
    const cleaned = this.removeUndefined(value);
    return isEmptyObject(cleaned) ? undefined : cleaned;
  }

  visitSubmodelElementList(element: SubmodelElementList, context?: ValueVisitorContextType): JsonType {
    return element.value.map(v => v.accept(this, { fullParentIdShortPath: this.buildFullIdShortPath(element, context) })).filter(e => e !== undefined);
  }
}
