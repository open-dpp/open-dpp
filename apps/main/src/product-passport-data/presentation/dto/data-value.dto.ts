import type { DataValue } from "../../domain/data-value";

import { z } from "zod";

export const DataValueDtoSchema = z.object({
  value: z.unknown(),
  dataSectionId: z.uuid(),
  dataFieldId: z.uuid(),
  row: z.int(),
});

export type DataValueDto = z.infer<typeof DataValueDtoSchema>;

export function dataValueToDto(dataValue: DataValue) {
  return DataValueDtoSchema.parse({
    dataFieldId: dataValue.dataFieldId,
    dataSectionId: dataValue.dataSectionId,
    row: dataValue.row,
    value: dataValue.value,
  });
}
