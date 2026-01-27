import { NotFoundException } from "@nestjs/common";
import { ModellingKindType, SubmodelJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { AdministrativeInformation } from "../common/administrative-information";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../json-visitor";
import { ModifierVisitor } from "../modifier-visitor";
import { IPersistable } from "../persistable";
import { ValueModifierVisitor } from "../value-modifier-visitor";
import { JsonType, ValueVisitor } from "../value-visitor";
import { IVisitor } from "../visitor";
import {
  IdShortPath,
  ISubmodelBase,
  ISubmodelElement,
  parseSubmodelBaseUnion,
  SubmodelBaseProps,
  submodelBasePropsFromPlain,
} from "./submodel-base";

export class Submodel implements ISubmodelBase, IPersistable {
  private constructor(
    public readonly id: string,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    public displayName: Array<LanguageText>,
    public description: Array<LanguageText>,
    public readonly administration: AdministrativeInformation | null,
    public readonly kind: ModellingKindType | null,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly submodelElements: Array<ISubmodelElement>,
  ) {
  }

  static create(
    data: SubmodelBaseProps & {
      id: string;
      extensions?: Array<Extension>;
      administration?: AdministrativeInformation | null;
      kind?: ModellingKindType | null;
      submodelElements?: Array<ISubmodelElement>;
    },
  ) {
    return new Submodel(
      data.id,
      data.extensions ?? [],
      data.category ?? null,
      data.idShort,
      data.displayName ?? [],
      data.description ?? [],
      data.administration ?? null,
      data.kind ?? null,
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.submodelElements ?? [],
    );
  };

  static fromPlain(data: unknown): Submodel {
    const parsed = SubmodelJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new Submodel(
      parsed.id,
      parsed.extensions.map(x => Extension.fromPlain(x)),
      baseObjects.category,
      baseObjects.idShort,
      baseObjects.displayName,
      baseObjects.description,
      parsed.administration ? AdministrativeInformation.fromPlain(parsed.administration) : null,
      parsed.kind ?? null,
      baseObjects.semanticId,
      baseObjects.supplementalSemanticIds,
      baseObjects.qualifiers,
      baseObjects.embeddedDataSpecifications,
      parsed.submodelElements.map(parseSubmodelBaseUnion),
    );
  };

  modify(data: unknown) {
    this.accept(new ModifierVisitor(), data);
  }

  modifySubmodelElement(data: unknown, idShortPath: IdShortPath) {
    const submodelElement = this.findSubmodelElementOrFail(idShortPath);
    submodelElement.accept(new ModifierVisitor(), data);
    return submodelElement;
  }

  modifyValueOfSubmodelElement(data: unknown, idShortPath: IdShortPath) {
    const submodelElement = this.findSubmodelElementOrFail(idShortPath);
    submodelElement.accept(new ValueModifierVisitor(), data);
    return submodelElement;
  }

  getValueRepresentation(idShortPath?: IdShortPath): JsonType {
    const element = idShortPath ? this.findSubmodelElementOrFail(idShortPath) : this;
    const valueVisitor = new ValueVisitor();
    return element.accept(valueVisitor);
  }

  findSubmodelElementOrFail(idShortPath: IdShortPath): ISubmodelBase {
    const element = this.findSubmodelElement(idShortPath);
    if (!element) {
      throw new NotFoundException(`Submodel element with idShortPath ${idShortPath.toString()} not found`);
    }
    return element;
  }

  findSubmodelElement(idShortPath: IdShortPath): ISubmodelBase | undefined {
    let current: ISubmodelBase | undefined;

    let children = [...this.getSubmodelElements()];

    for (const segment of idShortPath.segments) {
      current = children.find(el => el.idShort === segment);
      if (!current) {
        return undefined; // path broken
      }
      children = [...current.getSubmodelElements()]; // descend
    }

    return current;
  }

  public addSubmodelElement(submodelElement: ISubmodelElement, idShortPath?: IdShortPath): ISubmodelElement {
    if (idShortPath) {
      const parent = this.findSubmodelElementOrFail(idShortPath);
      parent.addSubmodelElement(submodelElement);
    }
    else {
      if (this.submodelElements.find(el => el.idShort === submodelElement.idShort)) {
        throw new ValueError(`Submodel element with idShort ${submodelElement.idShort} already exists`);
      }
      this.submodelElements.push(submodelElement);
    }
    return submodelElement;
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitSubmodel(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }

  * getSubmodelElements(): IterableIterator<ISubmodelElement> {
    yield* this.submodelElements;
  }
}
