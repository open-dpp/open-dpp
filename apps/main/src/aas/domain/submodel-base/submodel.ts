import { randomUUID } from "node:crypto";
import { NotFoundException } from "@nestjs/common";
import { KeyTypes, ModellingKindType, ReferenceTypes, SubmodelJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { isEmptyObject } from "../../../utils";
import { AdministrativeInformation } from "../common/administrative-information";
import { IdShortPath } from "../common/id-short-path";
import { Key } from "../common/key";
import { hasUniqueLanguagesOrFail, LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { ConvertToPlainOptions } from "../convertable-to-plain";
import { ICopyOptions } from "../copy-options";
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
  addSubmodelElementOrFail,
  DeleteOptions,
  deleteSubmodelElementOrFail,
  ISubmodelBase,
  ISubmodelElement,
  parseSubmodelElement,
  setParentIdShortPaths,
  SubmodelBaseProps,
  submodelBasePropsFromPlain,
} from "./submodel-base";
import { SubmodelElementList } from "./submodel-element-list";
import { TableExtension } from "./table-extension";
import { IActivity } from "../../../activity-history/activity";
import { SubmodelActivity } from "../../../activity-history/aas/submodel.activity";
import { SubmodelOperationTypes } from "../../../activity-history/submodel-operation-types";

export class Submodel implements ISubmodelBase, IPersistable {
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private _activities: Array<IActivity> = [];
  private constructor(
    public readonly id: string,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    public readonly administration: AdministrativeInformation,
    public readonly kind: ModellingKindType | null,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly submodelElements: Array<ISubmodelElement>,
  ) {
    this.displayName = displayName;
    this.description = description;
    setParentIdShortPaths(this, this.idShort);
  }

  getIdShortPath(): IdShortPath {
    return IdShortPath.create({ path: this.idShort });
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
      data.administration ?? AdministrativeInformation.create({ version: "1", revision: "0" }),
      data.kind ?? null,
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.submodelElements ?? [],
    );
  }

  static fromPlain(data: unknown): Submodel {
    const parsed = SubmodelJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new Submodel(
      parsed.id,
      parsed.extensions.map((x) => Extension.fromPlain(x)),
      baseObjects.category,
      baseObjects.idShort,
      baseObjects.displayName,
      baseObjects.description,
      parsed.administration
        ? AdministrativeInformation.fromPlain(parsed.administration)
        : AdministrativeInformation.create({ version: "1", revision: "0" }),
      parsed.kind ?? null,
      baseObjects.semanticId,
      baseObjects.supplementalSemanticIds,
      baseObjects.qualifiers,
      baseObjects.embeddedDataSpecifications,
      parsed.submodelElements.map(parseSubmodelElement),
    );
  }

  modify(data: unknown, options: ModifierVisitorOptions) {
    const oldData = this.toPlain();
    this.accept(new ModifierVisitor(options), { data });
    this.publishActivity(
      SubmodelActivity.create({
        digitalProductDocumentId: options.digitalProductDocumentId,
        submodelId: this.id,
        administration: this.administration,
        fullIdShortPath: this.getIdShortPath(),
        operation: SubmodelOperationTypes.SubmodelModification,
        userId: options.ability.userId ?? undefined,
        oldData,
        newData: this.toPlain(),
      }),
    );
  }

  private publishActivity(activity: IActivity) {
    this._activities.push(activity);
    this.administration.increaseVersion();
  }

  get activities(): Array<IActivity> {
    return this._activities;
  }

  pullActivities(): Array<IActivity> {
    const events = [...this._activities];
    this._activities = [];
    return events;
  }

  modifyValue(data: unknown, options: ValueModifierVisitorOptions) {
    const oldData = this.toPlain();
    this.accept(new ValueModifierVisitor(options), { data });
    this.publishActivity(
      SubmodelActivity.create({
        digitalProductDocumentId: options.digitalProductDocumentId,
        administration: this.administration,
        submodelId: this.id,
        fullIdShortPath: this.getIdShortPath(),
        userId: options.ability.userId ?? undefined,
        oldData,
        newData: this.toPlain(),
        operation: SubmodelOperationTypes.SubmodelValueModification,
      }),
    );
  }

  modifySubmodelElement(data: unknown, idShortPath: IdShortPath, options: ModifierVisitorOptions) {
    const submodelElement = this.findSubmodelElementOrFail(idShortPath);
    const oldData = submodelElement.toPlain();
    submodelElement.accept(new ModifierVisitor(options), { data });
    this.publishActivity(
      SubmodelActivity.create({
        digitalProductDocumentId: options.digitalProductDocumentId,
        administration: this.administration,
        submodelId: this.id,
        fullIdShortPath: submodelElement.getIdShortPath(),
        userId: options.ability.userId ?? undefined,
        oldData,
        newData: submodelElement.toPlain(),
        operation: SubmodelOperationTypes.SubmodelElementModification,
      }),
    );
    return submodelElement;
  }

  modifyValueOfSubmodelElement(
    data: unknown,
    idShortPath: IdShortPath,
    options: ValueModifierVisitorOptions,
  ) {
    const submodelElement = this.findSubmodelElementOrFail(idShortPath);
    const oldData = submodelElement.toPlain();
    submodelElement.accept(new ValueModifierVisitor(options), { data });
    this.publishActivity(
      SubmodelActivity.create({
        digitalProductDocumentId: options.digitalProductDocumentId,
        submodelId: this.id,
        administration: this.administration,
        fullIdShortPath: submodelElement.getIdShortPath(),
        userId: options.ability.userId ?? undefined,
        operation: SubmodelOperationTypes.SubmodelElementValueModification,
        oldData,
        newData: submodelElement.toPlain(),
      }),
    );
    return submodelElement;
  }

  private getListAsTableExtensionOrFail(idShortPath: IdShortPath) {
    const submodelElement = this.findSubmodelElementOrFail(idShortPath);
    if (submodelElement instanceof SubmodelElementList) {
      return new TableExtension(submodelElement);
    } else {
      throw new ValueError(
        `Cannot add column to ${submodelElement.getSubmodelElementType()} submodel element`,
      );
    }
  }

  addRow(idShortPath: IdShortPath, options: AddOptions) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    const oldData = tableExtension.getTableElement().toPlain();
    tableExtension.addRow(options);
    this.publishActivity(
      SubmodelActivity.create({
        digitalProductDocumentId: options.digitalProductDocumentId!, // TODO: Remove ! after migration to new activity history
        submodelId: this.id,
        administration: this.administration,
        fullIdShortPath: this.getIdShortPath().concat(idShortPath),
        userId: options.ability.userId ?? undefined,
        operation: SubmodelOperationTypes.SubmodelRowCreate,
        oldData,
        newData: tableExtension.getTableElement().toPlain(),
      }),
    );
    return tableExtension.getTableElement();
  }

  deleteRow(idShortPath: IdShortPath, idShortOfRow: string, options: DeleteOptions) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.deleteRow(idShortOfRow, options);
    return tableExtension.getTableElement();
  }

  addColumn(idShortPath: IdShortPath, column: ISubmodelElement, options: AddOptions) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    const oldData = tableExtension.getTableElement().toPlain();
    tableExtension.addColumn(column, options);
    this.publishActivity(
      SubmodelActivity.create({
        digitalProductDocumentId: options.digitalProductDocumentId!, // TODO: Remove ! after migration to new activity history
        submodelId: this.id,
        administration: this.administration,
        fullIdShortPath: this.getIdShortPath().concat(idShortPath),
        oldData,
        newData: tableExtension.getTableElement().toPlain(),
        userId: options.ability.userId ?? undefined,
        operation: SubmodelOperationTypes.SubmodelColumnCreate,
      }),
    );
    return tableExtension.getTableElement();
  }

  modifyColumn(
    idShortPath: IdShortPath,
    idShortOfColumn: string,
    data: unknown,
    options: ModifierVisitorOptions,
  ) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    const oldData = tableExtension.getTableElement().toPlain();
    tableExtension.modifyColumn(idShortOfColumn, data, options);
    this.publishActivity(
      SubmodelActivity.create({
        digitalProductDocumentId: options.digitalProductDocumentId,
        submodelId: this.id,
        administration: this.administration,
        fullIdShortPath: idShortPath.addPathSegment(idShortOfColumn),
        userId: options.ability.userId ?? undefined,
        operation: SubmodelOperationTypes.SubmodelColumnModification,
        oldData,
        newData: tableExtension.getTableElement().toPlain(),
      }),
    );
    return tableExtension.getTableElement();
  }

  deleteColumn(idShortPath: IdShortPath, idShortOfColumn: string, options: DeleteOptions) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.deleteColumn(idShortOfColumn, options);
    return tableExtension.getTableElement();
  }

  getValueRepresentation({
    idShortPath,
    options,
  }: {
    idShortPath?: IdShortPath;
    options: ValueVisitorOptions;
  }): JsonType {
    const element = idShortPath ? this.findSubmodelElementOrFail(idShortPath) : this;
    const valueVisitor = new ValueVisitor(options);
    return element.accept(valueVisitor);
  }

  findSubmodelElementOrFail(idShortPath: IdShortPath): ISubmodelElement {
    const element = this.findSubmodelElement(idShortPath);
    if (!element) {
      throw new NotFoundException(
        `Submodel element with idShortPath ${idShortPath.toString()} not found`,
      );
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
      current = children.find((el) => el.idShort === segment);
      if (!current) {
        return undefined; // path broken
      }
      children = current.getSubmodelElements(); // descend
    }

    return current;
  }

  public addSubmodelElement(
    submodelElement: ISubmodelElement,
    options: AddOptions,
  ): ISubmodelElement {
    let addedSubmodelElement: ISubmodelElement;
    let fullIdShortPath = this.getIdShortPath();
    let oldData: unknown;
    let newData: unknown;
    if (options.idShortPath) {
      const parent = this.findSubmodelElementOrFail(options.idShortPath);
      submodelElement.setParentIdShortPath(parent.getIdShortPath());
      fullIdShortPath.concat(options.idShortPath);
      oldData = parent.toPlain();
      addedSubmodelElement = parent.addSubmodelElement(submodelElement, options);
      newData = parent.toPlain();
    } else {
      oldData = this.toPlain();
      addedSubmodelElement = addSubmodelElementOrFail(this, submodelElement, options);
      newData = this.toPlain();
    }
    this.publishActivity(
      SubmodelActivity.create({
        digitalProductDocumentId: options.digitalProductDocumentId!, // TODO: Remove ! after migration to new activity history
        submodelId: this.id,
        administration: this.administration,
        fullIdShortPath: fullIdShortPath,
        oldData,
        newData,
        operation: SubmodelOperationTypes.SubmodelElementCreate,
        userId: options.ability.userId ?? undefined,
      }),
    );
    return addedSubmodelElement;
  }

  public deleteSubmodelElement(idShortPath: IdShortPath, options: DeleteOptions) {
    const parent = this.findSubmodelElementParent(idShortPath);
    if (idShortPath.last) {
      if (!parent) {
        deleteSubmodelElementOrFail(this.submodelElements, idShortPath.last, options);
      } else {
        parent.deleteSubmodelElement(idShortPath.last, options);
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

  copy(options?: ICopyOptions): Submodel | undefined {
    const plain = this.toPlain(options);
    if (isEmptyObject(plain)) {
      return undefined;
    }
    return Submodel.fromPlain({
      ...plain,
      id: randomUUID(),
    });
  }
}

export function submodelToReference(submodel: Submodel): Reference {
  return Reference.create({
    type: ReferenceTypes.ModelReference,
    keys: [
      Key.create({
        type: KeyTypes.Submodel,
        value: submodel.id,
      }),
    ],
  });
}
