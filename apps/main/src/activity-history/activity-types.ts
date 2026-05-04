import { z } from "zod";

export const ActivityTypes = {
  SubmodelElementModification: "SubmodelElementModification",
} as const;
export const ActivityTypesEnum = z.enum(ActivityTypes);
export type ActivityTypesType = z.infer<typeof ActivityTypesEnum>;
