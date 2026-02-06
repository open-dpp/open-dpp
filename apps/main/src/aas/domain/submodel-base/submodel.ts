import { randomUUID } from "node:crypto";
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
  AddOptions,
  deleteSubmodelElementOrFail,
  IdShortPath,
  ISubmodelBase,
  ISubmodelElement,
  parseSubmodelElement,
  SubmodelBaseProps,
  submodelBasePropsFromPlain,
} from "./submodel-base";
import { SubmodelElementList } from "./submodel-element-list";
import { TableExtension } from "./table-extension";

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
      parsed.submodelElements.map(parseSubmodelElement),
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

  private getListAsTableExtensionOrFail(idShortPath: IdShortPath) {
    const submodelElement = this.findSubmodelElementOrFail(idShortPath);
    if (submodelElement instanceof SubmodelElementList) {
      return new TableExtension(submodelElement);
    }
    else {
      throw new ValueError(`Cannot add column to ${submodelElement.getSubmodelElementType()} submodel element`);
    }
  }

  addRow(idShortPath: IdShortPath, position?: number) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    const options = position !== undefined ? { position } : undefined;
    tableExtension.addRow(options);
    return tableExtension.getTableElement();
  }

  deleteRow(idShortPath: IdShortPath, idShortOfRow: string) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.deleteRow(idShortOfRow);
    return tableExtension.getTableElement();
  }

  addColumn(idShortPath: IdShortPath, column: ISubmodelElement, position?: number) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    const options = position !== undefined ? { position } : undefined;
    tableExtension.addColumn(column, options);
    return tableExtension.getTableElement();
  }

  modifyColumn(idShortPath: IdShortPath, idShortOfColumn: string, data: unknown) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.modifyColumn(idShortOfColumn, data);
    return tableExtension.getTableElement();
  }

  deleteColumn(idShortPath: IdShortPath, idShortOfColumn: string) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.deleteColumn(idShortOfColumn);
    return tableExtension.getTableElement();
  }

  getValueRepresentation(idShortPath?: IdShortPath): JsonType {
    const element = idShortPath ? this.findSubmodelElementOrFail(idShortPath) : this;
    const valueVisitor = new ValueVisitor();
    return element.accept(valueVisitor);
  }

  findSubmodelElementOrFail(idShortPath: IdShortPath): ISubmodelElement {
    const element = this.findSubmodelElement(idShortPath);
    if (!element) {
      throw new NotFoundException(`Submodel element with idShortPath ${idShortPath.toString()} not found`);
    }
    return element;
  }

  findSubmodelElementParent(idShortPath: IdShortPath): ISubmodelElement | undefined {
    return this.findSubmodelElement(idShortPath.getParentPath());
  }

  findSubmodelElement(idShortPath: IdShortPath): ISubmodelElement | undefined {
    let current: ISubmodelElement | undefined;

    let children = this.getSubmodelElements();

    for (const segment of idShortPath.segments) {
      current = children.find(el => el.idShort === segment);
      if (!current) {
        return undefined; // path broken
      }
      children = current.getSubmodelElements(); // descend
    }

    return current;
  }

  public addSubmodelElement(submodelElement: ISubmodelElement, options?: AddOptions): ISubmodelElement {
    if (options?.idShortPath) {
      const parent = this.findSubmodelElementOrFail(options.idShortPath);
      parent.addSubmodelElement(submodelElement, options);
    }
    else {
      if (this.submodelElements.find(el => el.idShort === submodelElement.idShort)) {
        throw new ValueError(`Submodel element with idShort ${submodelElement.idShort} already exists`);
      }
      if (options?.position !== undefined) {
        this.submodelElements.splice(options.position, 0, submodelElement);
      }
      else {
        this.submodelElements.push(submodelElement);
      }
    }
    return submodelElement;
  }

  public deleteSubmodelElement(idShortPath: IdShortPath) {
    const parent = this.findSubmodelElementParent(idShortPath);
    if (!parent) {
      deleteSubmodelElementOrFail(this.submodelElements, idShortPath.last);
    }
    else {
      parent.deleteSubmodelElement(idShortPath.last);
    }
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitSubmodel(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }

  getSubmodelElements(): ISubmodelElement[] {
    return this.submodelElements;
  }

  copy(): Submodel {
    return Submodel.fromPlain({
      ...this.toPlain(),
      id: randomUUID(),
    });
  }
}
