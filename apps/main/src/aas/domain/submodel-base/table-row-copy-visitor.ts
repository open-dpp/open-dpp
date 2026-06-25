import { AssetAdministrationShell } from "../asset-adminstration-shell";
import { AssetInformation } from "../asset-information";
import { AdministrativeInformation } from "../common/administrative-information";
import { IVisitor } from "../visitor";
import { AnnotatedRelationshipElement } from "./annotated-relationship-element";
import { Blob } from "./blob";
import { File } from "./file";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { Entity } from "./entity";
import { MultiLanguageProperty } from "./multi-language-property";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { LanguageText } from "../common/language-text";
import { ReferenceElement } from "./reference-element";
import { Resource } from "../resource";
import { SpecificAssetId } from "../specific-asset-id";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { RelationshipElement } from "./relationship-element";
import { SubmodelElementList } from "./submodel-element-list";
import { Submodel } from "./submodel";
import { Key } from "../common/key";
import { Range } from "./range";
import { ConceptDescription } from "../concept-description";
import { Property } from "./property";

export interface TableRowCopyVisitorContextType {}
/**
 * TableRowCopyVisitor used when copying table columns to new rows.
 * Ensures that new rows receive clean column templates without inheriting
 * data values from the source column.
 *
 * Transformation rules:
 * - Property and File elements: sets value to null
 * - SubmodelElementList with multiple items: keeps only the first item as template
 * - Other elements: no transformation applied
 */
export class TableRowCopyVisitor implements IVisitor<TableRowCopyVisitorContextType, void> {
  constructor() {}

  visitAdministrativeInformation(
    _element: AdministrativeInformation,
    _context?: TableRowCopyVisitorContextType,
  ): void {}

  visitAnnotatedRelationshipElement(
    _element: AnnotatedRelationshipElement,
    _context?: TableRowCopyVisitorContextType,
  ): void {}

  visitAssetAdministrationShell(
    _element: AssetAdministrationShell,
    _context?: TableRowCopyVisitorContextType,
  ): void {}

  visitAssetInformation(
    _element: AssetInformation,
    _context?: TableRowCopyVisitorContextType,
  ): void {}

  visitBlob(_element: Blob, _context?: TableRowCopyVisitorContextType): void {}

  visitConceptDescription(
    _element: ConceptDescription,
    _context?: TableRowCopyVisitorContextType,
  ): void {}

  visitEmbeddedDataSpecification(
    _element: EmbeddedDataSpecification,
    _context?: TableRowCopyVisitorContextType,
  ): void {}

  visitEntity(_element: Entity, _context?: TableRowCopyVisitorContextType): void {}

  visitExtension(_element: Extension, _context?: TableRowCopyVisitorContextType): void {}

  visitFile(element: File, _context?: TableRowCopyVisitorContextType): void {
    element.value = null;
  }

  visitKey(_element: Key, _context?: TableRowCopyVisitorContextType): void {}

  visitLanguageText(_element: LanguageText, _context?: TableRowCopyVisitorContextType): void {}

  visitMultiLanguageProperty(
    element: MultiLanguageProperty,
    _context?: TableRowCopyVisitorContextType,
  ): void {
    element.value = [];
  }

  visitProperty(element: Property, _context?: TableRowCopyVisitorContextType): void {
    element.value = null;
  }

  visitQualifier(_element: Qualifier, _context?: TableRowCopyVisitorContextType): void {}

  visitRange(_element: Range, _context?: TableRowCopyVisitorContextType): void {}

  visitReference(_element: Reference, _context?: TableRowCopyVisitorContextType): void {}

  visitReferenceElement(
    _element: ReferenceElement,
    _context?: TableRowCopyVisitorContextType,
  ): void {}

  visitRelationshipElement(
    _element: RelationshipElement,
    _context?: TableRowCopyVisitorContextType,
  ): void {}

  visitResource(_element: Resource, _context?: TableRowCopyVisitorContextType): void {}

  visitSpecificAssetId(
    _element: SpecificAssetId,
    _context?: TableRowCopyVisitorContextType,
  ): void {}

  visitSubmodel(_element: Submodel, _context?: TableRowCopyVisitorContextType): void {}

  visitSubmodelElementCollection(
    _element: SubmodelElementCollection,
    _context?: TableRowCopyVisitorContextType,
  ): void {}

  visitSubmodelElementList(
    element: SubmodelElementList,
    _context?: TableRowCopyVisitorContextType,
  ): void {
    if (element.getSubmodelElements().length > 1) {
      element.setSubmodelElements([element.getSubmodelElements()[0]]);
    }
  }
}
