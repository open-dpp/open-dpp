import type { GranularityLevel_TYPE } from "./granularity-level";

export const DataFieldType = {
  TEXT_FIELD: "TextField",
  PRODUCT_PASSPORT_LINK: "ProductPassportLink",
  NUMERIC_FIELD: "NumericField",
  FILE_FIELD: "FileField",
} as const;

export type DataFieldType_TYPE = (typeof DataFieldType)[keyof typeof DataFieldType];

export abstract class DataFieldBase {
  public readonly id: string;
  protected _name: string;
  protected _type: DataFieldType_TYPE;
  protected _options: Record<string, unknown> = {};
  public readonly granularityLevel: GranularityLevel_TYPE;

  public constructor(
    id: string,
    _name: string,
    _type: DataFieldType_TYPE,
    _options: Record<string, unknown> = {},
    granularityLevel: GranularityLevel_TYPE,
  ) {
    this.id = id;
    this._name = _name;
    this._type = _type;
    this._options = _options;
    this.granularityLevel = granularityLevel;
  }

  get name() {
    return this._name;
  }

  get type() {
    return this._type;
  }

  get options() {
    return this._options;
  }
}
