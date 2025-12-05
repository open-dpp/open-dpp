import { z } from "zod";

export const DataTypeDef = {
  AnyUri: "AnyUri",
  Base64Binary: "Base64Binary",
  Boolean: "Boolean",
  Byte: "Byte",
  Date: "Date",
  DateTime: "DateTime",
  Decimal: "Decimal",
  Double: "Double",
  Duration: "Duration",
  Float: "Float",
  GDay: "GDay",
  GMonth: "GMonth",
  GMonthDay: "GMonthDay",
  GYear: "GYear",
  GYearMonth: "GYearMonth",
  HexBinary: "HexBinary",
  Int: "Int",
  Integer: "Integer",
  Long: "Long",
  NegativeInteger: "NegativeInteger",
  NonNegativeInteger: "NonNegativeInteger",
  NonPositiveInteger: "NonPositiveInteger",
  PositiveInteger: "PositiveInteger",
  Short: "Short",
  String: "String",
  Time: "Time",
  UnsignedByte: "UnsignedByte",
  UnsignedInt: "UnsignedInt",
  UnsignedLong: "UnsignedLong",
  UnsignedShort: "UnsignedShort",
} as const;

export const DataTypeDefEnum = z.enum(DataTypeDef);
export type DataTypeDefType = z.infer<typeof DataTypeDefEnum>;
