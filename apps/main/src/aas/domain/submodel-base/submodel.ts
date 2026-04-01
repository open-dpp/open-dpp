import { randomUUID } from "node:crypto";
import { NotFoundException } from "@nestjs/common";
import { ModellingKindType, SubmodelJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { AdministrativeInformation } from "../common/administrative-information";
import { hasUniqueLanguagesOrFail, LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { ConvertToPlainOptions } from "../convertable-to-plain";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import JsonVisitor from "../json-visitor";
import { ModifierVisitor, ModifierVisitorOptions } from "../modifier-visitor";
import { IPersistable } from "../persistable";
import { ValueModifierVisitor, ValueModifierVisitorOptions } from "../value-modifier-visitor";
import { JsonType, ValueVisitor, ValueVisitorOptions } from "../value-visitor";
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
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private constructor(
    public readonly id: string,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    public readonly administration: AdministrativeInformation | null,
    public readonly kind: ModellingKindType | null,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly submodelElements: Array<ISubmodelElement>,
  ) {
    this.displayName = displayName;
    this.description = description;
  }

  set displayName(value: Array<LanguageText>) {
    this._displayName = value;
  }

  get displayName(): Array<LanguageText> {
    return this._displayName;
  }

  set description(value: Array<LanguageText>) {
    hasUniqueLanguagesOrFail(value);
    this._description = value;
  }

  get description(): Array<LanguageText> {
    return this._description;
  }

  static create(
    data: SubmodelBaseProps & {
      id?: string;
      extensions?: Array<Extension>;
      administration?: AdministrativeInformation | null;
      kind?: ModellingKindType | null;
      submodelElements?: Array<ISubmodelElement>;
    },
  ) {
    return new Submodel(
      data.id ?? randomUUID(),
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

  modify(data: unknown, options: ModifierVisitorOptions) {
    this.accept(new ModifierVisitor(options), { data });
  }

  modifySubmodelElement(data: unknown, idShortPath: IdShortPath, options: ModifierVisitorOptions) {
    const submodelElement = this.findSubmodelElementOrFail(idShortPath);
    let fullParentIdShortPath = IdShortPath.create({ path: this.idShort });
    if (!idShortPath.getParentPath().isEmpty()) {
      fullParentIdShortPath = fullParentIdShortPath.concat(idShortPath.getParentPath());
    }
    submodelElement.accept(new ModifierVisitor(options), { data, fullParentIdShortPath });
    return submodelElement;
  }

  modifyValueOfSubmodelElement(data: unknown, idShortPath: IdShortPath, options: ValueModifierVisitorOptions) {
    const submodelElement = this.findSubmodelElementOrFail(idShortPath);
    let fullParentIdShortPath = IdShortPath.create({ path: this.idShort });
    if (!idShortPath.getParentPath().isEmpty()) {
      fullParentIdShortPath = fullParentIdShortPath.concat(idShortPath.getParentPath());
    }
    submodelElement.accept(new ValueModifierVisitor(options), { data, fullParentIdShortPath });
    return submodelElement;
  }

  private getListAsTableExtensionOrFail(idShortPath: IdShortPath) {
    const submodelElement = this.findSubmodelElementOrFail(idShortPath);
    if (submodelElement instanceof SubmodelElementList) {
      return new TableExtension(submodelElement, this.idShort);
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

  modifyColumn(idShortPath: IdShortPath, idShortOfColumn: string, data: unknown, options: ModifierVisitorOptions) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.modifyColumn(idShortOfColumn, data, options);
    return tableExtension.getTableElement();
  }

  deleteColumn(idShortPath: IdShortPath, idShortOfColumn: string) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.deleteColumn(idShortOfColumn);
    return tableExtension.getTableElement();
  }

  getValueRepresentation({ idShortPath, options }: { idShortPath?: IdShortPath; options: ValueVisitorOptions }): JsonType {
    const element = idShortPath ? this.findSubmodelElementOrFail(idShortPath) : this;
    const context = idShortPath
      ? { fullParentIdShortPath: IdShortPath.create({ path: this.idShort }).concat(idShortPath) }
      : undefined;

    const valueVisitor = new ValueVisitor(options);
    return element.accept(valueVisitor, context);
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
    if (idShortPath.last) {
      if (!parent) {
        deleteSubmodelElementOrFail(this.submodelElements, idShortPath.last);
      }
      else {
        parent.deleteSubmodelElement(idShortPath.last);
      }
    }
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitSubmodel(this, context);
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor, options?.context);
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
