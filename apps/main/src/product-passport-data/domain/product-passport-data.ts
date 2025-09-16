import { Template } from '../../templates/domain/template';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { UniqueProductIdentifier } from '../../unique-product-identifier/domain/unique.product.identifier';
import { DataValue } from './data-value';

export abstract class ProductPassportData {
  abstract granularityLevel: GranularityLevel;

  protected constructor(
    public readonly id: string,
    private _ownedByOrganizationId: string,
    private _createdByUserId: string,
    public readonly uniqueProductIdentifiers: UniqueProductIdentifier[] = [],
    private _templateId: string,
    private _dataValues: DataValue[] = [],
  ) {}

  public get createdByUserId() {
    return this._createdByUserId;
  }

  public get ownedByOrganizationId() {
    return this._ownedByOrganizationId;
  }

  public isOwnedBy(organizationId: string) {
    return this.ownedByOrganizationId === organizationId;
  }

  public get templateId() {
    return this._templateId;
  }

  public get dataValues() {
    return this._dataValues;
  }

  public getDataValuesBySectionId(sectionId: string, row?: number) {
    const allRows = this.dataValues.filter(
      (d) => d.dataSectionId === sectionId,
    );
    return row !== undefined ? allRows.filter((d) => d.row === row) : allRows;
  }

  public addDataValues(dataValues: DataValue[]) {
    for (const dataValue of dataValues) {
      if (
        this.dataValues.find(
          (d) =>
            d.dataFieldId === dataValue.dataFieldId &&
            d.dataSectionId === dataValue.dataSectionId &&
            d.row === dataValue.row,
        )
      ) {
        throw new Error(
          `Data value for section ${dataValue.dataSectionId}, field ${dataValue.dataFieldId}, row ${dataValue.row} already exists`,
        );
      }
    }
    this.dataValues.push(...dataValues);
  }

  public modifyDataValues(dataValues: DataValue[]) {
    this._dataValues = this.dataValues.map((existingDataValue) => {
      const incomingDataValue = dataValues.find(
        (dataValue) =>
          dataValue.dataFieldId === existingDataValue.dataFieldId &&
          dataValue.dataSectionId === existingDataValue.dataSectionId &&
          dataValue.row === existingDataValue.row,
      );
      if (incomingDataValue) {
        return DataValue.create({
          value: incomingDataValue.value,
          dataSectionId: existingDataValue.dataSectionId,
          dataFieldId: existingDataValue.dataFieldId,
          row: existingDataValue.row,
        });
      }
      return existingDataValue;
    });
  }

  protected initializeDataValueFromTemplate(template: Template) {
    this._dataValues = template.createInitialDataValues(this.granularityLevel);
  }

  public createUniqueProductIdentifier(externalUUID?: string) {
    const uniqueProductIdentifier = UniqueProductIdentifier.create({
      externalUUID,
      referenceId: this.id,
    });
    this.uniqueProductIdentifiers.push(uniqueProductIdentifier);
    return uniqueProductIdentifier;
  }
}
