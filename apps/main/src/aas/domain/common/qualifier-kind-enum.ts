import { z } from "zod";

export const QualifierKind = {
  ValueQualifier: "ValueQualifier",
  ConceptQualifier: "ConceptQualifier",
  TemplateQualifier: "TemplateQualifier",
} as const;
export const QualifierKindEnum = z.enum(QualifierKind);
export type QualifierKindType = z.infer<typeof QualifierKindEnum>;
