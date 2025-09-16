import {
  DataFieldDto,
  DataFieldType,
  DataSectionDto,
  GranularityLevel,
  ProductPassportDto,
  SectionType,
} from "@open-dpp/api-client";
import { DeepPartialObject, Factory } from "fishery";
import { v4 as uuid4 } from "uuid";
import { BuildOptions } from "fishery/dist/types";

export class ProductPassportFactory extends Factory<ProductPassportDto> {
  private _dataSections: DataSectionDto[] = [];
  addDataSection(dataSection: DataSectionDto, parentSectionId?: string) {
    if (parentSectionId) {
      const parentSection = this._dataSections.find(
        (d) => d.id === parentSectionId,
      )!;
      parentSection.subSections.push(dataSection.id);
      dataSection = { ...dataSection, parentId: parentSection.id };
    }
    this._dataSections.push(dataSection);
    return this;
  }

  override build(
    params?: DeepPartialObject<DataSectionDto> | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: BuildOptions<DataSectionDto, any> | undefined,
  ) {
    const result: ProductPassportDto = super.build(
      {
        ...params,
        dataSections: this._dataSections,
      },
      options,
    );
    this._dataSections = [];
    return result;
  }
}

export const productPassportFactory = ProductPassportFactory.define(() => {
  const id = uuid4();
  return {
    id,
    name: `Product Name ${id}`,
    description: "Product Description",
    dataSections: [],
  };
});

export class DataSectionFactory extends Factory<DataSectionDto> {
  private _dataFields: DataFieldDto[] = [];
  private _dataValues: Record<string, unknown>[] = [];
  addDataField(dataField: DataFieldDto) {
    this._dataFields.push(dataField);
    return this;
  }
  addDataValue(fieldId: string, dataValue: unknown, row: number = 0) {
    this._dataValues[row] = this._dataValues[row] ?? {};
    this._dataValues[row][fieldId] = dataValue;
    return this;
  }
  override build(
    params?: DeepPartialObject<DataSectionDto> | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: BuildOptions<DataSectionDto, any> | undefined,
  ) {
    const result: DataSectionDto = super.build(
      {
        ...params,
        dataFields: this._dataFields,
        dataValues: this._dataValues,
      },
      options,
    );
    this._dataFields = [];
    this._dataValues = [];
    return result;
  }
}

export const dataSectionFactory = DataSectionFactory.define(() => {
  const id = uuid4();
  return {
    id,
    name: `section ${id}`,
    type: SectionType.GROUP,
    parentId: undefined,
    subSections: [],
    granularityLevel: GranularityLevel.MODEL,
    dataFields: [],
    dataValues: [],
  };
});

export const dataFieldFactory = Factory.define<DataFieldDto>(() => {
  const id = uuid4();
  return {
    id,
    name: `field ${id}`,
    type: DataFieldType.TEXT_FIELD,
    granularityLevel: GranularityLevel.MODEL,
  };
});
