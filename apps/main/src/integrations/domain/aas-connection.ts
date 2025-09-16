import { randomUUID } from 'crypto';
import { DataValue } from '../../product-passport-data/domain/data-value';
import {
  AasProperty,
  AssetAdministrationShell,
  AssetAdministrationShellType,
} from './asset-administration-shell';
import { Model } from '../../models/domain/model';
import { Template } from '../../templates/domain/template';
import { DataFieldType } from '../../data-modelling/domain/data-field-base';
import { z } from 'zod';
import {ValueError} from "@app/exception/domain.errors";

export class AasConnection {
  private constructor(
    public readonly id: string,
    public name: string,
    public ownedByOrganizationId: string,
    public createdByUserId: string,
    private _dataModelId: string,
    public readonly aasType: AssetAdministrationShellType,
    private _modelId: string | null,
    private _fieldAssignments: AasFieldAssignment[],
  ) {}

  get fieldAssignments() {
    return this._fieldAssignments;
  }

  get dataModelId() {
    return this._dataModelId;
  }

  get modelId() {
    return this._modelId;
  }

  static create(data: {
    name: string;
    organizationId: string;
    userId: string;
    dataModelId: string;
    aasType: AssetAdministrationShellType;
    modelId: string | null;
  }) {
    return new AasConnection(
      randomUUID(),
      data.name,
      data.organizationId,
      data.userId,
      data.dataModelId,
      data.aasType,
      data.modelId,
      [],
    );
  }

  static loadFromDb(data: {
    id: string;
    name: string;
    organizationId: string;
    userId: string;
    dataModelId: string;
    aasType: AssetAdministrationShellType;
    modelId: string | null;
    fieldAssignments: AasFieldAssignment[];
  }) {
    return new AasConnection(
      data.id,
      data.name,
      data.organizationId,
      data.userId,
      data.dataModelId,
      data.aasType,
      data.modelId,
      data.fieldAssignments,
    );
  }

  rename(name: string) {
    this.name = name;
  }

  isOwnedBy(organizationId: string) {
    return this.ownedByOrganizationId === organizationId;
  }

  generateDataValues(
    assetAdministrationShell: AssetAdministrationShell,
    template: Template,
  ) {
    return assetAdministrationShell.propertiesWithParent
      .map(({ parentIdShort, property }) => {
        const field = this.fieldAssignments.find(
          (fieldMapping) =>
            fieldMapping.idShort === property.idShort &&
            fieldMapping.idShortParent === parentIdShort,
        );

        if (field) {
          const dataFieldOfTemplate = template
            .findSectionById(field.sectionId)
            ?.dataFields.find((d) => d.id === field.dataFieldId);
          if (dataFieldOfTemplate) {
            return DataValue.create({
              dataSectionId: field.sectionId,
              dataFieldId: field.dataFieldId,
              value: this.parseValue(property, dataFieldOfTemplate.type),
              row: 0, // TODO: Replace hard coded row id
            });
          }
        }
        return undefined;
      })
      .filter((value) => value !== undefined);
  }

  private parseValue(property: AasProperty, dataFieldType: DataFieldType) {
    switch (dataFieldType) {
      case DataFieldType.NUMERIC_FIELD:
        return z.number().parse(Number(property.value));
      default:
        return property.value;
    }
  }

  assignModel(model: Model) {
    this._modelId = model.id;
    if (!model.templateId) {
      throw new ValueError(
        `Model ${model.id} does not have a product data model assigned`,
      );
    }
    this._dataModelId = model.templateId;
  }

  replaceFieldAssignments(fieldAssignments: AasFieldAssignment[]) {
    this._fieldAssignments = fieldAssignments;
  }

  addFieldAssignment(fieldAssignment: AasFieldAssignment) {
    this.fieldAssignments.push(fieldAssignment);
  }
}

export class AasFieldAssignment {
  private constructor(
    public readonly dataFieldId: string,
    public readonly sectionId: string,
    public readonly idShortParent: string,
    public readonly idShort: string,
  ) {}

  public static create(data: {
    dataFieldId: string;
    sectionId: string;
    idShortParent: string;
    idShort: string;
  }) {
    return new AasFieldAssignment(
      data.dataFieldId,
      data.sectionId,
      data.idShortParent,
      data.idShort,
    );
  }
}
