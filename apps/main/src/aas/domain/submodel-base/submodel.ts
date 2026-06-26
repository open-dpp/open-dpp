import { randomUUID } from "node:crypto";
import { NotFoundException } from "@nestjs/common";
import {
  KeyTypes,
  ModellingKindType,
  Permissions,
  ReferenceTypes,
  SubmodelJsonSchema,
} from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
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
  ISubmodelElementSearchable,
  parseSubmodelElement,
  SubmodelBaseProps,
  submodelBasePropsFromPlain,
} from "./submodel-base";
import { TableExtension } from "./table/table-extension";
import { SubmodelElementAdded } from "../../../activity-history/domain/change-events/submodel-element-added";
import {
  ChangeTracker,
  ITrackable,
  withTrackingHelper,
} from "../../../activity-history/domain/change-tracker";
import { SubmodelElementDeleted } from "../../../activity-history/domain/change-events/submodel-element-deleted";
import { Pointer } from "./pointer";
import { NestedTableExtension } from "./table/nested-table-extension";
import { ITableExtendable, parseAsSubmodelElementListOrFail } from "./table/table-extensable";
import { AccessResult } from "../security/access-allowed";

export class Submodel
  implements ISubmodelBase, IPersistable, ITrackable, ISubmodelElementSearchable
{
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  public readonly tracker;
  private _parentPointer = Pointer.create({});
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
    private submodelElements: Array<ISubmodelElement>,
  ) {
    this.displayName = displayName;
    this.description = description;
    this._parentPointer.setParentPointersOfSubmodelElements(this);
    this.tracker = ChangeTracker.create({
      onStopCallback: () => this.administration.increaseVersion(),
    });
  }

  getPointer(): Pointer {
    return this._parentPointer.getPointerToElement(this);
  }

  getReference(): Reference {
    return this._parentPointer.getReferenceToElement(this);
  }

  withTracking(changeTracker?: ChangeTracker) {
    return withTrackingHelper(changeTracker, this);
  }

  getIdShortPath(): IdShortPath {
    return this._parentPointer.getIdShortPathToElement(this);
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
    const modifierVisitor = new ModifierVisitor(options).withTracking(this.tracker);
    this.accept(modifierVisitor, { data });
  }

  modifyValue(data: unknown, options: ValueModifierVisitorOptions) {
    const modifierVisitor = new ValueModifierVisitor(options).withTracking(this.tracker);
    this.accept(modifierVisitor, { data });
  }

  modifySubmodelElement(data: unknown, idShortPath: IdShortPath, options: ModifierVisitorOptions) {
    const submodelElement = this.findSubmodelElementOrFail(idShortPath);
    const modifierVisitor = new ModifierVisitor(options).withTracking(this.tracker);
    submodelElement.accept(modifierVisitor, { data });
    return submodelElement;
  }

  modifyValueOfSubmodelElement(
    data: unknown,
    idShortPath: IdShortPath,
    options: ValueModifierVisitorOptions,
  ) {
    const submodelElement = this.findSubmodelElementOrFail(idShortPath);
    const modifierVisitor = new ValueModifierVisitor(options).withTracking(this.tracker);
    submodelElement.accept(modifierVisitor, { data });
    return submodelElement;
  }

  private getListAsTableExtensionOrFail(idShortPath: IdShortPath): ITableExtendable {
    const submodelElementList = parseAsSubmodelElementListOrFail(
      this.findSubmodelElementOrFail(idShortPath),
    );
    const tableExtension = submodelElementList.hasParentList()
      ? NestedTableExtension.create({
          data: submodelElementList,
          submodelElementSearch: this,
        })
      : new TableExtension(submodelElementList);
    return tableExtension.withTracking(this.tracker);
  }

  addRow(idShortPath: IdShortPath, options: AddOptions) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.addRow(options);
    return tableExtension.getTableElement();
  }

  deleteRow(idShortPath: IdShortPath, idShortOfRow: string, options: DeleteOptions) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.deleteRow(idShortOfRow, options);
    return tableExtension.getTableElement();
  }

  addColumn(idShortPath: IdShortPath, column: ISubmodelElement, options: AddOptions) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.addColumn(column, options);
    return tableExtension.getTableElement();
  }

  modifyColumn(
    idShortPath: IdShortPath,
    idShortOfColumn: string,
    data: unknown,
    options: ModifierVisitorOptions,
  ) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.modifyColumn(idShortOfColumn, data, options);
    return tableExtension.getTableElement();
  }

  deleteColumn(idShortPath: IdShortPath, idShortOfColumn: string, options: DeleteOptions) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.deleteColumn(idShortOfColumn, options);
    return tableExtension.getTableElement();
  }

  addColumnToGroup(
    idShortPath: IdShortPath,
    groupIdShort: string,
    column: ISubmodelElement,
    options: AddOptions,
  ) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.addColumnToGroup(groupIdShort, column, options);
    return tableExtension.getTableElement();
  }

  modifyColumnInGroup(
    idShortPath: IdShortPath,
    groupIdShort: string,
    idShortOfColumn: string,
    data: unknown,
    options: ModifierVisitorOptions,
  ) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.modifyColumnInGroup(groupIdShort, idShortOfColumn, data, options);
    return tableExtension.getTableElement();
  }

  deleteColumnFromGroup(
    idShortPath: IdShortPath,
    groupIdShort: string,
    idShortOfColumn: string,
    options: DeleteOptions,
  ) {
    const tableExtension = this.getListAsTableExtensionOrFail(idShortPath);
    tableExtension.deleteColumnFromGroup(groupIdShort, idShortOfColumn, options);
    return tableExtension.getTableElement();
  }

  getKeyType() {
    return KeyTypes.Submodel;
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
    if (options.idShortPath) {
      const parent = this.findSubmodelElementOrFail(options.idShortPath);
      submodelElement.setParentPointer(parent.getPointer());
      addedSubmodelElement = parent.addSubmodelElement(submodelElement, options);
    } else {
      addedSubmodelElement = addSubmodelElementOrFail(this, submodelElement, options);
    }
    this.tracker.track(
      SubmodelElementAdded.create({
        path: addedSubmodelElement.getIdShortPath(),
        submodelElement: addedSubmodelElement,
      }),
    );
    return addedSubmodelElement;
  }

  public deleteSubmodelElement(idShortPath: IdShortPath, options: DeleteOptions): ISubmodelElement {
    const parent = this.findSubmodelElementParent(idShortPath);
    let deletedSubmodelElement: ISubmodelElement;
    if (idShortPath.last) {
      if (!parent) {
        deletedSubmodelElement = deleteSubmodelElementOrFail(
          this.submodelElements,
          idShortPath.last,
          options,
        );
      } else {
        deletedSubmodelElement = parent.deleteSubmodelElement(idShortPath.last, options);
      }
      this.tracker.track(
        SubmodelElementDeleted.create({
          path: deletedSubmodelElement.getIdShortPath(),
          submodelElement: deletedSubmodelElement,
        }),
      );
      return deletedSubmodelElement;
    } else {
      throw new ValueError(
        `Cannot delete submodel element with idShortPath ${idShortPath.toString()}`,
      );
    }
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitSubmodel(this, context);
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor, options?.context);
  }

  setSubmodelElements(submodelElements: Array<ISubmodelElement>): void {
    this.submodelElements = submodelElements;
    this.getSubmodelElements().forEach((se) => {
      se.setParentPointer(this.getPointer());
    });
  }

  getSubmodelElements(): ISubmodelElement[] {
    return this.submodelElements;
  }

  copy(options?: ICopyOptions): AccessResult<Submodel> {
    const submodelElementsCopy = this.getSubmodelElements().map((se) => se.copy(options));

    if (
      options?.ability === undefined ||
      options?.ability?.can(Permissions.Read, this.getIdShortPath()) ||
      submodelElementsCopy.some((se) => se.isAllowed)
    ) {
      const plainClone = this.toPlain(options);
      const copy = Submodel.fromPlain({ ...plainClone, id: randomUUID() });
      copy.setSubmodelElements(
        submodelElementsCopy.filter((se) => se.isAllowed).map((se) => se.value),
      );
      if (options?.transformer) {
        copy.accept(options.transformer);
      }
      return AccessResult.allowed(copy);
    } else {
      return AccessResult.denied();
    }
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
