import { z } from "zod";
import { DataTypeDef } from "../../../domain/common/data-type-def";

export const ValueTypeDbSchema = z.enum(DataTypeDef);
