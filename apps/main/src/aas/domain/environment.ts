import { EnvironmentJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { IConvertableToPlain } from "./convertable-to-plain";
import { Submodel } from "./submodel-base/submodel";
import { IActivity } from "../../activity-history/activity";
import { EnvironmentActivity } from "../../activity-history/aas/environment.activity";
import { EnvironmentOperationTypes } from "../../activity-history/environment-types";
import { AddOptions } from "./submodel-base/submodel-base";

export class Environment implements IConvertableToPlain {
  private _activities: Array<IActivity> = [];

  private constructor(
    public readonly assetAdministrationShells: Array<string>,
    public readonly submodels: Array<string>,
    public readonly conceptDescriptions: Array<string>,
  ) {}

  static create(data: {
    assetAdministrationShells?: Array<string>;
    submodels?: Array<string>;
    conceptDescriptions?: Array<string>;
  }): Environment {
    return new Environment(
      data.assetAdministrationShells ?? [],
      data.submodels ?? [],
      data.conceptDescriptions ?? [],
    );
  }

  static fromPlain(data: unknown): Environment {
    const parsed = EnvironmentJsonSchema.parse(data);
    return new Environment(
      parsed.assetAdministrationShells,
      parsed.submodels,
      parsed.conceptDescriptions,
    );
  }

  private publishActivity(activity: IActivity) {
    this._activities.push(activity);
  }

  get activities(): Array<IActivity> {
    return this._activities;
  }

  pullActivities(): Array<IActivity> {
    const events = [...this._activities];
    this._activities = [];
    return events;
  }

  addAssetAdministrationShell(
    assetAdministrationShell: AssetAdministrationShell,
  ): AssetAdministrationShell {
    if (this.assetAdministrationShells.includes(assetAdministrationShell.id)) {
      throw new ValueError(
        `AssetAdministrationShell with id ${assetAdministrationShell.id} already exists`,
      );
    }
    this.assetAdministrationShells.push(assetAdministrationShell.id);
    return assetAdministrationShell;
  }

  addSubmodel(
    submodel: Submodel,
    options: Pick<AddOptions, "ability" | "digitalProductDocumentId">,
  ) {
    if (this.submodels.includes(submodel.id)) {
      throw new ValueError(`Submodel with id ${submodel.id} already exists`);
    }
    const oldData = JSON.parse(JSON.stringify(this.toPlain()));
    this.submodels.push(submodel.id);
    this.publishActivity(
      EnvironmentActivity.create({
        oldData,
        newData: this.toPlain(),
        operation: EnvironmentOperationTypes.SubmodelCreate,
        userId: options?.ability.userId ?? undefined,
        digitalProductDocumentId: options.digitalProductDocumentId,
      }),
    );

    return submodel;
  }

  deleteSubmodel(submodel: Submodel) {
    const index = this.submodels.indexOf(submodel.id);
    if (index === -1) {
      throw new ValueError(`Submodel with id ${submodel.id} does not exist`);
    }
    this.submodels.splice(index, 1);
  }

  toPlain(): Record<string, any> {
    return {
      assetAdministrationShells: this.assetAdministrationShells,
      submodels: this.submodels,
      conceptDescriptions: this.conceptDescriptions,
    };
  }
}
