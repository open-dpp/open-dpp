import { SubmodelElementSchema } from "@open-dpp/dto";
import { z } from "zod";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { ISubmodelElement } from "../../../aas/domain/submodel-base/submodel-base";

export const ColumnGroupSchema = z.object({
  groupIdShort: z.string(),
  path: z.string(),
  position: z.number(),
  value: SubmodelElementSchema,
});

export interface ColumnGroupEventCreateProps {
  groupIdShort: string;
  path: IdShortPath;
  position: number;
  value: ISubmodelElement;
}
