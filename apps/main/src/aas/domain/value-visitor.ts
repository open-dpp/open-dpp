import { Buffer } from "node:buffer";
import { NotSupportedError } from "@open-dpp/exception";
import { z } from "zod";
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

export type JsonType = z.infer<typeof z.json>;
export class ValueVisitor implements IVisitor<any, JsonType> {
  visitAdministrativeInformation(_element: AdministrativeInformation, _context: any): JsonType {
    throw new NotSupportedError(
      "AdministrativeInformation is not supported for value serialization.",
    );
  }

  visitAnnotatedRelationshipElement(element: AnnotatedRelationshipElement, context: any): JsonType {
    return { first: element.first.accept(this, context), second: element.second.accept(this, context) };
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

  visitBlob(element: Blob, _context: any): JsonType {
    return element.value ? { contentType: element.contentType, value: Buffer.from(element.value).toString("utf-8") } : { contentType: element.contentType, value: undefined };
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

  visitEntity(element: Entity, context: any): JsonType {
    return {
      entityType: element.entityType,
      globalAssetId: element.globalAssetId,
      statements: element.statements.map(st => ({ [st.idShort]: st.accept(this, context) })),
      specificAssetIds: element.specificAssetIds.map(specificAssetId => specificAssetId.accept(this, context)),
    };
  }

  visitExtension(_element: Extension, _context: any): JsonType {
    throw new NotSupportedError(
      "Extension is not supported for value serialization.",
    );
  }

  visitFile(element: File, _context: any): JsonType {
    return { contentType: element.contentType, value: element.value };
  }

  visitKey(element: Key, _context: any): JsonType {
    return { type: element.type, value: element.value };
  }

  visitLanguageText(element: LanguageText, _context: any): JsonType {
    return { [element.language]: element.text };
  }

  visitMultiLanguageProperty(element: MultiLanguageProperty, context: any): JsonType {
    return element.value.map(v => v.accept(this, context));
  }

  visitProperty(element: Property, _context: any): JsonType {
    return element.value;
  }

  visitQualifier(_element: Qualifier, _context: any): JsonType {
    throw new NotSupportedError(
      "Qualifier is not supported for value serialization.",
    );
  }

  visitRange(element: Range, _context: any): JsonType {
    return { min: element.min, max: element.max };
  }

  visitReference(element: Reference, context: any): JsonType {
    return {
      type: element.type,
      ...(element.referredSemanticId && { referredSemanticId: element.referredSemanticId.accept(this, context) }),
      keys: element.keys.map(key => key.accept(this, context)),
    };
  }

  visitReferenceElement(element: ReferenceElement, _context: any): JsonType {
    return element.value?.accept(this) ?? null;
  }

  visitRelationshipElement(element: RelationshipElement, context: any): JsonType {
    return { first: element.first.accept(this, context), second: element.second.accept(this, context) };
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

  visitSubmodel(element: Submodel, context: any): JsonType {
    const value: { [key: string]: any } = {};
    for (const submodelElement of element.submodelElements) {
      value[submodelElement.idShort] = submodelElement.accept(this, context);
    }
    return value;
  }

  visitSubmodelElementCollection(element: SubmodelElementCollection, context: any): JsonType {
    const value: { [key: string]: any } = {};
    for (const submodelElement of element.value) {
      value[submodelElement.idShort] = submodelElement.accept(this, context);
    }
    return value;
  }

  visitSubmodelElementList(element: SubmodelElementList, context: any): JsonType {
    return element.value.map(v => v.accept(this, context));
  }
}
