import {
  FileModificationSchema,
  LanguageEnum,
  SubmodelBaseModificationSchema,
  SubmodelElementModificationDto,
} from "@open-dpp/dto";
import { NotSupportedError, ValueError } from "@open-dpp/exception";
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
import { ISubmodelBase, ISubmodelElement } from "./submodel-base/submodel-base";

import { SubmodelElementCollection } from "./submodel-base/submodel-element-collection";
import { SubmodelElementList } from "./submodel-base/submodel-element-list";
import { IVisitor } from "./visitor";

export class ValueModifierVisitor implements IVisitor<unknown, void> {
  private modifySubmodelBase(submodelBase: ISubmodelBase, data: unknown) {
    const { displayName, description } = SubmodelBaseModificationSchema.parse(data);
    submodelBase.displayName = displayName?.map(LanguageText.fromPlain) ?? submodelBase.displayName;
    submodelBase.description = description?.map(LanguageText.fromPlain) ?? submodelBase.displayName;
  }

  visitAdministrativeInformation(_element: AdministrativeInformation, _context: unknown): void {
    throw new NotSupportedError(
      "AdministrativeInformation is not supported.",
    );
  }

  visitAnnotatedRelationshipElement(_element: AnnotatedRelationshipElement, _context: unknown): void {
    throw new NotSupportedError(
      "AnnotatedRelationshipElement is not supported.",
    );
  }

  visitAssetAdministrationShell(_element: AssetAdministrationShell, _context: unknown): void {
    throw new NotSupportedError(
      "AssetAdministrationShell is not supported.",
    );
  }

  visitAssetInformation(_element: AssetInformation, _context: unknown): void {
    throw new NotSupportedError(
      "AssetInformation is not supported.",
    );
  }

  visitBlob(_element: Blob, _context: unknown): void {
    throw new NotSupportedError(
      "Blob is not supported.",
    );
  }

  visitConceptDescription(_element: ConceptDescription, _context: unknown): void {
    throw new NotSupportedError(
      "ConceptDescription is not supported.",
    );
  }

  visitEmbeddedDataSpecification(_element: EmbeddedDataSpecification, _context: unknown): void {
    throw new NotSupportedError(
      "EmbeddedDataSpecification is not supported.",
    );
  }

  visitEntity(_element: Entity, _context: unknown): void {
    throw new NotSupportedError(
      "Entity is not supported.",
    );
  }

  visitExtension(_element: Extension, _context: unknown): void {
    throw new NotSupportedError(
      "Extension is not supported.",
    );
  }

  visitFile(element: File, context: unknown): void {
    const parsed = FileModificationSchema.parse(context);
    this.modifySubmodelBase(element, parsed);
    element.value = parsed.value ?? element.value;
    element.contentType = parsed.contentType ?? element.contentType;
  }

  visitKey(_element: Key, _context: unknown): void {
    throw new NotSupportedError(
      "Key is not supported.",
    );
  }

  visitLanguageText(_element: LanguageText, _context: unknown): void {
    throw new NotSupportedError(
      "LanguageText is not supported.",
    );
  }

  visitMultiLanguageProperty(element: MultiLanguageProperty, context: unknown): void {
    const parsed = z.record(z.string(), z.string()).array().parse(context);
    element.value = parsed.map(record =>
      Object.entries(record).map(([language, text]) => LanguageText.create({ language: LanguageEnum.parse(language), text }))).flat();
  }

  visitProperty(element: Property, context: unknown): void {
    const value = z.string().nullish().parse(context);
    if (value !== undefined) {
      element.value = value;
    }
  }

  visitQualifier(_element: Qualifier, _context: unknown): void {
    throw new NotSupportedError(
      "Qualifier is not supported.",
    );
  }

  visitRange(_element: Range, _context: unknown): void {
    throw new NotSupportedError(
      "Range is not supported.",
    );
  }

  visitReference(_element: Reference, _context: unknown): void {
    throw new NotSupportedError(
      "Reference is not supported.",
    );
  }

  visitReferenceElement(_element: ReferenceElement, _context: unknown): void {
    throw new NotSupportedError(
      "ReferenceElement is not supported.",
    );
  }

  visitRelationshipElement(_element: RelationshipElement, _context: unknown): void {
    throw new NotSupportedError(
      "RelationshipElement is not supported.",
    );
  }

  visitResource(_element: Resource, _context: unknown): void {
    throw new NotSupportedError(
      "Resource is not supported.",
    );
  }

  visitSpecificAssetId(_element: SpecificAssetId, _context: unknown): void {
    throw new NotSupportedError(
      "SpecificAssetId is not supported.",
    );
  }

  visitSubmodel(element: Submodel, context: unknown): void {
    this.modifySubmodelBase(element, context);
  }

  visitSubmodelElementCollection(element: SubmodelElementCollection, context: unknown): void {
    const parsed = z.record(z.string(), z.any()).parse(context);

    for (const [key, value] of Object.entries(parsed)) {
      const foundElement = element.value.find(e => e.idShort === key);
      if (!foundElement) {
        throw new ValueError(`Could not find element with idShort ${key} within submodel element collection ${element.idShort}.`);
      }
      foundElement.accept(this, value);
    }
  }

  visitSubmodelElementList(element: SubmodelElementList, context: unknown): void {
    const parsed = z.record(z.string(), z.any()).array().parse(context);
    for (const [index, row] of parsed.entries()) {
      element.value[index].accept(this, row);
    }
  }

  visitSubmodelElements(element: ISubmodelElement, submodelElementModifications: SubmodelElementModificationDto[]): void {
    for (const submodelElement of submodelElementModifications) {
      const foundElement = element.getSubmodelElements().find(e => e.idShort === submodelElement.idShort);
      if (!foundElement) {
        throw new ValueError(`Could not find element with idShort ${submodelElement.idShort} within submodel element ${element.idShort}.`);
      }
      foundElement.accept(this, submodelElement);
    }
  }
}
