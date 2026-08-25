import { DataTypeDef, type DataTypeDefType, type LanguageType } from "@open-dpp/dto";
import formatDateValueForDisplay from "./date-value.ts";

export type PropertyValue = string | null;

export function formatPropertyValue(
  value: PropertyValue,
  type: DataTypeDefType,
  selectedLanguage: LanguageType,
  timezone?: string,
) {
  if (value === null) {
    return "N/A";
  }
  switch (type) {
    case DataTypeDef.Double:
      return new Intl.NumberFormat(selectedLanguage, {
        style: "decimal",
      }).format(Number(value));
    case DataTypeDef.Date:
    case DataTypeDef.DateTime:
      return formatDateValueForDisplay(String(value), type, timezone) ?? String(value);
    default:
      return value;
  }
}
