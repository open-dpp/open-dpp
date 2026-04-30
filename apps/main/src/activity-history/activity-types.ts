import { z } from "zod";

export const ActivityTypes = {
  SubmodelElementModificationEvent: "SubmodelElementModificationEvent",
} as const;
export const ActivityTypesEnum = z.enum(ActivityTypes);
export type ActivityTypesType = z.infer<typeof ActivityTypesEnum>;
