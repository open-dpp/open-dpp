import {
  AasSubmodelElementsType,
  KeyTypesEnum,
  KeyTypesType,
  Permissions,
  ReferenceTypes,
  SubmodelBaseJsonSchema,
} from "@open-dpp/dto";
import { ForbiddenError, ValueError } from "@open-dpp/exception";
import { z } from "zod";
import { IHasDataSpecification } from "../common/has-data-specification";
import { IHasSemantics } from "../common/has-semantics";
import { IdShortPath } from "../common/id-short-path";
import { Key } from "../common/key";
import { LanguageText } from "../common/language-text";
import { IQualifiable, Qualifier } from "../common/qualififiable";
import { IReferable } from "../common/referable";
import { Reference } from "../common/reference";
import { IConvertableToPlain } from "../convertable-to-plain";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { AasAbility } from "../security/aas-ability";
import { IVisitable } from "../visitor";
import { getSubmodelClass } from "./submodel-registry";
import { Pointer } from "./pointer";
import { ICopyOptions } from "../copy-options";
import { isEmptyObject } from "../../../utils";
import { AccessResult } from "../security/access-allowed";

export interface SubmodelBaseProps {
  category?: string | null;
  idShort: string;
  displayName?: Array<LanguageText>;
  description?: Array<LanguageText>;
  semanticId?: Reference | null;
  supplementalSemanticIds?: Array<Reference>;
  qualifiers?: Array<Qualifier>;
  embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
}

export interface SubmodelBaseObjects
  extends IReferable, IHasSemantics, IQualifiable, IHasDataSpecification {}

export function submodelBasePropsFromPlain(data: Record<string, unknown>): SubmodelBaseObjects {
  const parsed = SubmodelBaseJsonSchema.parse(data);
  return {
    category: parsed.category ?? null,
    idShort: parsed.idShort,
    displayName: parsed.displayName.map((x) => LanguageText.fromPlain(x)),
    description: parsed.description.map((x) => LanguageText.fromPlain(x)),
    semanticId: parsed.semanticId ? Reference.fromPlain(parsed.semanticId) : null,
    supplementalSemanticIds: parsed.supplementalSemanticIds.map((x) => Reference.fromPlain(x)),
    qualifiers: parsed.qualifiers.map((q) => Qualifier.fromPlain(q)),
    embeddedDataSpecifications: parsed.embeddedDataSpecifications.map((e) =>
      EmbeddedDataSpecification.fromPlain(e),
    ),
  };
}

export interface AddOptions {
  idShortPath?: IdShortPath;
  position?: number;
  ability: AasAbility;
}

export interface IHasIdShortPath {
  getIdShortPath: () => IdShortPath;
}

export interface IHasReference {
  getReference: () => Reference;
}

export interface IHasPointer {
  getPointer: () => Pointer;
}

export interface IHasSubmodelElements {
  addSubmodelElement: (submodelElement: ISubmodelElement, options: AddOptions) => ISubmodelElement;
  getSubmodelElements: () => ISubmodelElement[];
  setSubmodelElements: (submodelElements: ISubmodelElement[]) => void;
}

export interface ISubmodelElementSearchable {
  findSubmodelElementOrFail(idShortPath: IdShortPath): ISubmodelElement;
}

export interface ISubmodelBase
  extends
    SubmodelBaseObjects,
    IHasIdShortPath,
    IHasReference,
    IVisitable,
    IConvertableToPlain,
    IHasSubmodelElements,
    IHasPointer {
  getKeyType: () => KeyTypesType;
}

export interface ISubmodelElement extends ISubmodelBase {
  getSubmodelElementType: () => AasSubmodelElementsType;
  deleteSubmodelElement: (idShort: string, options: DeleteOptions) => ISubmodelElement;
  setParentPointer: (parentPointer: Pointer) => void;
  copy: (options?: ICopyOptions) => AccessResult<ISubmodelElement>;
}

export function parseSubmodelElement(submodelBase: any): ISubmodelElement {
  const schema = z.object({ modelType: KeyTypesEnum });
  const AasClass = getSubmodelClass(schema.parse(submodelBase).modelType);
  return AasClass.fromPlain(submodelBase);
}

export function createDefaultReference(element: ISubmodelBase): Reference {
  return Reference.create({
    type: ReferenceTypes.ModelReference,
    keys: [Key.create({ type: element.getKeyType(), value: element.idShort })],
  });
}

export interface DeleteOptions {
  ability: AasAbility;
  onDelete: (submodelElement: ISubmodelElement) => void;
}
export function deleteSubmodelElementOrFail(
  submodelElements: ISubmodelElement[],
  idShort: string,
  { ability, onDelete }: DeleteOptions,
): ISubmodelElement {
  const foundIndex = submodelElements.findIndex((e) => e.idShort === idShort);
  if (foundIndex === -1) {
    throw new ValueError(
      `Cannot delete submodel element with idShort ${idShort}, since it does not exist.`,
    );
  }
  const submodelElementToDelete = submodelElements[foundIndex];
  if (!ability.can(Permissions.Delete, submodelElementToDelete.getIdShortPath())) {
    throw new ForbiddenError(
      `Missing permissions to delete element ${submodelElementToDelete.getIdShortPath().toString()}.`,
    );
  }

  submodelElements.splice(foundIndex, 1);
  onDelete(submodelElementToDelete);
  return submodelElementToDelete;
}

export function addSubmodelElementOrFail(
  parent: IHasSubmodelElements & IHasIdShortPath & IHasPointer,
  submodelElement: ISubmodelElement,
  options: AddOptions,
): ISubmodelElement {
  submodelElement.setParentPointer(parent.getPointer());
  if (!options.ability.can(Permissions.Create, parent.getIdShortPath())) {
    throw new ForbiddenError(`Missing permissions to add element to ${parent.getIdShortPath()}.`);
  }
  const submodelElements = parent.getSubmodelElements();
  if (submodelElements.some((s) => s.idShort === submodelElement.idShort)) {
    throw new ValueError(`Submodel element with idShort ${submodelElement.idShort} already exists`);
  }
  if (options?.position !== undefined) {
    submodelElements.splice(options.position, 0, submodelElement);
  } else {
    submodelElements.push(submodelElement);
  }
  return submodelElement;
}

export function copySubmodelElement(
  submodelElement: ISubmodelElement,
  options?: ICopyOptions & { override?: any },
): AccessResult<ISubmodelElement> {
  const plainClone = { ...submodelElement.toPlain(options), ...options?.override };
  const transformed = options?.transformer ? options.transformer.transform(plainClone) : plainClone;
  if (isEmptyObject(transformed)) {
    return AccessResult.denied();
  }
  const copy = parseSubmodelElement(transformed);
  copy.setParentPointer(submodelElement.getPointer());
  return AccessResult.allowed(copy);
}
