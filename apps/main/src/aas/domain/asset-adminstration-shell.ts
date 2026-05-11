import { randomUUID } from "node:crypto";
import { AssetAdministrationShellJsonSchema, AssetKind } from "@open-dpp/dto";
import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { IHasDataSpecification } from "./common/has-data-specification";
import { IIdentifiable } from "./common/identifiable";
import { hasUniqueLanguagesOrFail, LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { ConvertToPlainOptions } from "./convertable-to-plain";
import { EmbeddedDataSpecification } from "./embedded-data-specification";
import { Extension } from "./extension";
import JsonVisitor from "./json-visitor";
import { ModifierVisitor, ModifierVisitorOptions } from "./modifier-visitor";
import { IPersistable } from "./persistable";
import { Security } from "./security/security";
import { Submodel, submodelToReference } from "./submodel-base/submodel";
import { IVisitable, IVisitor } from "./visitor";
import { IActivity } from "../../activity-history/activity";
import { AssetAdministrationShellModificationActivity } from "../../activity-history/aas/asset-administration-shell-modification.activity";
import { AssetAdministrationShellModificationActivityPayload } from "../../activity-history/aas/submodel-base/asset-administration-shell-modification.payload";

export interface AssetAdministrationShellCreateProps {
  id?: string;
  assetInformation?: AssetInformation;
  extensions?: Extension[];
  category?: string | null;
  idShort?: string | null;
  displayName?: LanguageText[];
  description?: LanguageText[];
  administration?: AdministrativeInformation;
  embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
  derivedFrom?: Reference | null;
  submodels?: Array<Reference>;
  security?: Security;
}

export class AssetAdministrationShell
  implements IIdentifiable, IHasDataSpecification, IVisitable, IPersistable
{
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private _activities: Array<IActivity> = [];

  private constructor(
    public readonly id: string,
    public readonly assetInformation: AssetInformation,
    public readonly extensions: Extension[],
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    public readonly administration: AdministrativeInformation,
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly derivedFrom: Reference | null = null,
    public readonly submodels: Array<Reference>,
    public readonly security: Security,
  ) {
    this.displayName = displayName;
    this.description = description;
  }

  set displayName(value: Array<LanguageText>) {
    hasUniqueLanguagesOrFail(value);
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

  static create(data: AssetAdministrationShellCreateProps) {
    const id = data.id ?? randomUUID();

    return new AssetAdministrationShell(
      id,
      data.assetInformation ??
        AssetInformation.create({ assetKind: AssetKind.Instance, globalAssetId: id }),
      data.extensions ?? [],
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? [],
      data.description ?? [],
      data.administration ?? AdministrativeInformation.create({ version: "1", revision: "0" }),
      data.embeddedDataSpecifications ?? [],
      data.derivedFrom ?? null,
      data.submodels ?? [],
      data.security ?? Security.create({}),
    );
  }

  modify(data: unknown, options: ModifierVisitorOptions) {
    this.accept(new ModifierVisitor(options), { data });
    this.publishActivity(
      AssetAdministrationShellModificationActivity.create({
        digitalProductDocumentId: options.digitalProductDocumentId,
        userId: options.ability.userId ?? undefined,
        payload: AssetAdministrationShellModificationActivityPayload.create({
          assetAdministrationShellId: this.id,
          data: data,
        }),
      }),
    );
  }

  addSubmodelReference(reference: Reference) {
    this.submodels.push(reference);
  }

  addSubmodel(submodel: Submodel): Reference {
    const reference = submodelToReference(submodel);

    this.addSubmodelReference(reference);
    this.security.addDefaultPolicyForSubmodelIfNoExists(submodel);

    return reference;
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitAssetAdministrationShell(this, context);
  }

  withAssetInformation(assetInformation: AssetInformation): AssetAdministrationShell {
    return new AssetAdministrationShell(
      this.id,
      assetInformation,
      this.extensions,
      this.category,
      this.idShort,
      this.displayName,
      this.description,
      this.administration,
      this.embeddedDataSpecifications,
      this.derivedFrom,
      this.submodels,
      this.security,
    );
  }

  /**
   * Creates a copy of this AssetAdministrationShell with the specified submodels.
   * This will NOT copy the existing submodel references but will create new references to the specified submodels.
   *
   * @param submodels - Array of Submodel instances to be added as references to the copy
   * @returns A new AssetAdministrationShell instance with the same properties but different submodel references
   */
  copy(submodels: Submodel[]): AssetAdministrationShell {
    const copyId = randomUUID();
    const plain = this.toPlain({ context: { filterSubmodels: submodels } });
    const copy = AssetAdministrationShell.fromPlain({
      ...plain,
      id: copyId,
      assetInformation: {
        ...plain.assetInformation,
        globalAssetId:
          plain.id === plain.assetInformation.globalAssetId
            ? copyId
            : plain.assetInformation.globalAssetId,
      },
      submodels: [],
    });

    submodels.forEach((model) => copy.addSubmodel(model));

    return copy;
  }

  static fromPlain(data: unknown): AssetAdministrationShell {
    const parsed = AssetAdministrationShellJsonSchema.parse(data);
    return new AssetAdministrationShell(
      parsed.id,
      AssetInformation.fromPlain(parsed.assetInformation),
      parsed.extensions.map(Extension.fromPlain),
      parsed.category,
      parsed.idShort,
      parsed.displayName.map(LanguageText.fromPlain),
      parsed.description.map(LanguageText.fromPlain),
      parsed.administration
        ? AdministrativeInformation.fromPlain(parsed.administration)
        : AdministrativeInformation.create({ version: "1", revision: "0" }),
      parsed.embeddedDataSpecifications.map(EmbeddedDataSpecification.fromPlain),
      parsed.derivedFrom ? Reference.fromPlain(parsed.derivedFrom) : null,
      parsed.submodels.map(Reference.fromPlain),
      Security.fromPlain(parsed.security),
    );
  }

  deleteSubmodel(submodel: Submodel) {
    const foundSubmodelIndex = this.submodels.findIndex((sm) =>
      sm.keys.some((k) => k.value === submodel.id),
    );
    if (foundSubmodelIndex > -1) {
      this.submodels.splice(foundSubmodelIndex, 1);
      this.security.deletePoliciesByObjectPath(submodel.getIdShortPath());
    }
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor, options?.context);
  }
}
