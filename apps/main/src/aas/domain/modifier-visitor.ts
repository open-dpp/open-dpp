import {
  FileModificationSchema,
  PropertyModificationSchema,
  SubmodelBaseModificationSchema,
  SubmodelElementCollectionModificationSchema,
  SubmodelElementListModificationSchema,
  SubmodelElementModificationDto,
} from "@open-dpp/dto";
import { NotSupportedError, ValueError } from "@open-dpp/exception";
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

export class ModifierVisitor implements IVisitor<unknown, void> {
  private modifySubmodelBase(submodelBase: ISubmodelBase, data: unknown) {
    const { displayName, description } = SubmodelBaseModificationSchema.parse(data);
    submodelBase.displayName = displayName?.map(LanguageText.fromPlain) ?? submodelBase.displayName;
    submodelBase.description = description?.map(LanguageText.fromPlain) ?? submodelBase.description;
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
    if (parsed.value !== undefined) {
      element.value = parsed.value;
    }
    if (parsed.contentType != null) {
      element.contentType = parsed.contentType;
    }
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

  visitMultiLanguageProperty(_element: MultiLanguageProperty, _context: unknown): void {
    throw new NotSupportedError(
      "MultiLanguageProperty is not supported.",
    );
  }

  visitProperty(element: Property, context: unknown): void {
    const parsed = PropertyModificationSchema.parse(context);
    this.modifySubmodelBase(element, parsed);
    if (parsed.value !== undefined) {
      element.value = parsed.value;
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
    const parsed = SubmodelElementCollectionModificationSchema.parse(context);
    this.modifySubmodelBase(element, context);
    if (parsed.value !== undefined) {
      this.visitSubmodelElements(element, parsed.value);
    }
  }

  visitSubmodelElementList(element: SubmodelElementList, context: unknown): void {
    const parsed = SubmodelElementListModificationSchema.parse(context);
    this.modifySubmodelBase(element, parsed);
    if (parsed.value !== undefined) {
      this.visitSubmodelElements(element, parsed.value);
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
