import { GranularityLevel } from './granularity-level';

export enum DataFieldType {
  TEXT_FIELD = 'TextField',
  PRODUCT_PASSPORT_LINK = 'ProductPassportLink',
  NUMERIC_FIELD = 'NumericField',
  FILE_FIELD = 'FileField',
}

export abstract class DataFieldBase {
  public constructor(
    public readonly id: string,
    protected _name: string,
    public readonly type: DataFieldType,
    public readonly options: Record<string, unknown> = {},
    public readonly granularityLevel: GranularityLevel,
  ) {}

  get name() {
    return this._name;
  }
}
