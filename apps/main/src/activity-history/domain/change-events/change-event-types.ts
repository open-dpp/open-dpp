import { z } from "zod";

export const ChangeEventTypes = {
  DisplayNameChanged: "DisplayNameChanged",
  DescriptionChanged: "DescriptionChanged",
  PropertyValueChanged: "PropertyValueChanged",
  FileValueChanged: "FileValueChanged",
  ReferenceElementValueChanged: "ReferenceElementChanged",
  RowAdded: "RowAdded",
  AddedSubmodelToEnv: "AddedSubmodelToEnv",
  SubmodelElementAdded: "SubmodelElementAdded",
  SubmodelElementDeleted: "SubmodelElementDeleted",
  SubmodelReferenceAdded: "SubmodelReferenceAdded",
} as const;
export const ChangeEventTypeEnum = z.enum(ChangeEventTypes);
export type ChangeEventTypesType = z.infer<typeof ChangeEventTypeEnum>;
