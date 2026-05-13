import { LanguageEnum, Permissions, ReferenceModificationSchema } from "@open-dpp/dto";
import { ForbiddenError, NotSupportedError, ValueError } from "@open-dpp/exception";
import { match, P } from "ts-pattern";
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
import { ISubmodelBase } from "./submodel-base/submodel-base";
import { SubmodelElementCollection } from "./submodel-base/submodel-element-collection";
import { SubmodelElementList } from "./submodel-base/submodel-element-list";
import { IVisitor } from "./visitor";

export interface ValueModifierVisitorOptions {
  ability: AasAbility;
  digitalProductDocumentId: string;
}
export interface ValueModifierVisitorContextType {
  data: unknown;
}

export class ValueModifierVisitor implements IVisitor<ValueModifierVisitorContextType, void> {
  constructor(private readonly options: ValueModifierVisitorOptions) {}

  private modificationGuard(element: ISubmodelBase) {
    const idShortPath = element.getIdShortPath();
    if (!this.options.ability.can(Permissions.Edit, idShortPath)) {
      throw new ForbiddenError(`Missing permissions to modify element ${idShortPath.toString()}.`);
    }
  }

  visitAdministrativeInformation(_element: AdministrativeInformation, _context: unknown): void {
    throw new NotSupportedError("AdministrativeInformation is not supported.");
  }

  visitAnnotatedRelationshipElement(
    _element: AnnotatedRelationshipElement,
    _context: unknown,
  ): void {
    throw new NotSupportedError("AnnotatedRelationshipElement is not supported.");
  }

  visitAssetAdministrationShell(_element: AssetAdministrationShell, _context: unknown): void {
    throw new NotSupportedError("AssetAdministrationShell is not supported.");
  }

  visitAssetInformation(_element: AssetInformation, _context: unknown): void {
    throw new NotSupportedError("AssetInformation is not supported.");
  }

  visitBlob(_element: Blob, _context: unknown): void {
    throw new NotSupportedError("Blob is not supported.");
  }

  visitConceptDescription(_element: ConceptDescription, _context: unknown): void {
    throw new NotSupportedError("ConceptDescription is not supported.");
  }

  visitEmbeddedDataSpecification(_element: EmbeddedDataSpecification, _context: unknown): void {
    throw new NotSupportedError("EmbeddedDataSpecification is not supported.");
  }

  visitEntity(_element: Entity, _context: unknown): void {
    throw new NotSupportedError("Entity is not supported.");
  }

  visitExtension(_element: Extension, _context: unknown): void {
    throw new NotSupportedError("Extension is not supported.");
  }

  visitFile(element: File, context?: ValueModifierVisitorContextType): void {
    this.modificationGuard(element);
    const parsed = z
      .object({
        value: z.string().nullish(),
        contentType: z.string().optional(),
      })
      .parse(context?.data);
    element.value = parsed.value !== undefined ? parsed.value : element.value;
    element.contentType =
      parsed.contentType !== undefined ? parsed.contentType : element.contentType;
  }

  visitKey(_element: Key, _context: unknown): void {
    throw new NotSupportedError("Key is not supported.");
  }

  visitLanguageText(_element: LanguageText, _context: unknown): void {
    throw new NotSupportedError("LanguageText is not supported.");
  }

  visitMultiLanguageProperty(
    element: MultiLanguageProperty,
    context?: ValueModifierVisitorContextType,
  ): void {
    this.modificationGuard(element);
    const parsed = z.record(z.string(), z.string()).array().parse(context?.data);
    element.value = parsed
      .map((record) =>
        Object.entries(record).map(([language, text]) =>
          LanguageText.create({ language: LanguageEnum.parse(language), text }),
        ),
      )
      .flat();
  }

  visitProperty(element: Property, context?: ValueModifierVisitorContextType): void {
    this.modificationGuard(element);
    const value = z
      .string()
      .nullish()
      .parse(context?.data ?? element.value);
    if (value !== undefined) {
      element.value = value;
    }
  }

  visitQualifier(_element: Qualifier, _context: unknown): void {
    throw new NotSupportedError("Qualifier is not supported.");
  }

  visitRange(_element: Range, _context: unknown): void {
    throw new NotSupportedError("Range is not supported.");
  }

  visitReference(element: Reference, context?: ValueModifierVisitorContextType): void {
    const parsed = ReferenceModificationSchema.parse(context?.data);

    if (parsed.type !== undefined) {
      element.type = parsed.type;
    }
    if (parsed.referredSemanticId === null) {
      element.referredSemanticId = parsed.referredSemanticId;
    } else if (parsed.referredSemanticId !== undefined) {
      if (element.referredSemanticId !== null) {
        element.referredSemanticId.accept(this, { ...context, data: parsed.referredSemanticId });
      } else {
        element.referredSemanticId = Reference.fromPlain(parsed.referredSemanticId);
      }
    }
    if (parsed.keys !== undefined) {
      element.keys = parsed.keys.map(Key.fromPlain);
    }
  }

  visitReferenceElement(
    element: ReferenceElement,
    context?: ValueModifierVisitorContextType,
  ): void {
    this.modificationGuard(element);
    const parsedValue = ReferenceModificationSchema.nullish().parse(context?.data);
    const input = { value: element.value, newValue: parsedValue };
    match(input)
      .with(
        {
          value: P.any,
          newValue: null,
        },
        ({ newValue }) => {
          element.value = newValue;
        },
      )
      .with({ value: null, newValue: P.nonNullable }, ({ newValue }) => {
        element.value = Reference.fromPlain(newValue);
      })
      .with({ value: P.nonNullable, newValue: P.nonNullable }, ({ newValue }) => {
        element.value?.accept(this, { ...context, data: newValue });
      })
      .otherwise(() => {});
  }

  visitRelationshipElement(_element: RelationshipElement, _context: unknown): void {
    throw new NotSupportedError("RelationshipElement is not supported.");
  }

  visitResource(_element: Resource, _context: unknown): void {
    throw new NotSupportedError("Resource is not supported.");
  }

  visitSpecificAssetId(_element: SpecificAssetId, _context: unknown): void {
    throw new NotSupportedError("SpecificAssetId is not supported.");
  }

  visitSubmodel(element: Submodel, context?: ValueModifierVisitorContextType): void {
    const parsed = z.record(z.string(), z.any()).parse(context?.data);

    for (const [key, value] of Object.entries(parsed)) {
      const foundElement = element.submodelElements.find((e) => e.idShort === key);
      if (!foundElement) {
        throw new ValueError(
          `Could not find element with idShort ${key} within submodel ${element.idShort}.`,
        );
      }
      foundElement.accept(this, { data: value });
    }
  }

  visitSubmodelElementCollection(
    element: SubmodelElementCollection,
    context?: ValueModifierVisitorContextType,
  ): void {
    const parsed = z.record(z.string(), z.any()).parse(context?.data);

    for (const [key, value] of Object.entries(parsed)) {
      const foundElement = element.value.find((e) => e.idShort === key);
      if (!foundElement) {
        throw new ValueError(
          `Could not find element with idShort ${key} within submodel element collection ${element.idShort}.`,
        );
      }
      foundElement.accept(this, { data: value });
    }
  }

  visitSubmodelElementList(
    element: SubmodelElementList,
    context?: ValueModifierVisitorContextType,
  ): void {
    const parsed = z.record(z.string(), z.any()).array().parse(context?.data);
    for (const [index, row] of parsed.entries()) {
      const target = element.value[index];
      if (!target) {
        throw new ValueError(
          `List index ${index} is out of bounds for submodel element list ${element.idShort}.`,
        );
      }
      target.accept(this, { data: row });
    }
  }
}
