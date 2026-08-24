import { cloneDeep, unset } from "lodash";
import type { MappingRow } from "../composables/bulk-import/bulk-import-mapping.ts";
import type { BulkImportRowDto } from "@open-dpp/dto";
import { type MaybeRefOrGetter, toValue } from "vue";

export function removeMappingsFromRow(
  rowRaw: MaybeRefOrGetter<BulkImportRowDto | null>,
  mappings: MaybeRefOrGetter<MappingRow[]>,
) {
  const rowAsValue = toValue(rowRaw);
  const row = rowAsValue ? cloneDeep(rowAsValue) : {};
  const mappingsAsValue = toValue(mappings);
  if (mappingsAsValue.length > 0) {
    mappingsAsValue.forEach((fieldMapping) => {
      unset(row, fieldMapping.input);
    });
  }
  console.log(row);
  return row;
}
