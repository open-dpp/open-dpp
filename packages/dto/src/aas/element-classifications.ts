import { DataTypeDef, type DataTypeDefType } from "./enums/data-type-def";

export const INTEGER_DATA_TYPES: ReadonlySet<DataTypeDefType> = new Set([
  DataTypeDef.Integer,
  DataTypeDef.Long,
  DataTypeDef.Int,
  DataTypeDef.Short,
  DataTypeDef.Byte,
  DataTypeDef.NegativeInteger,
  DataTypeDef.NonNegativeInteger,
  DataTypeDef.NonPositiveInteger,
  DataTypeDef.PositiveInteger,
  DataTypeDef.UnsignedByte,
  DataTypeDef.UnsignedInt,
  DataTypeDef.UnsignedLong,
  DataTypeDef.UnsignedShort,
]);

export const NUMERIC_DATA_TYPES: ReadonlySet<DataTypeDefType> = new Set<DataTypeDefType>([
  ...INTEGER_DATA_TYPES,
  DataTypeDef.Decimal,
  DataTypeDef.Double,
  DataTypeDef.Float,
]);

export function isIntegerDataType(value: string | undefined | null): value is DataTypeDefType {
  return typeof value === "string" && INTEGER_DATA_TYPES.has(value as DataTypeDefType);
}

export function isNumericDataType(value: string | undefined | null): value is DataTypeDefType {
  return typeof value === "string" && NUMERIC_DATA_TYPES.has(value as DataTypeDefType);
}
