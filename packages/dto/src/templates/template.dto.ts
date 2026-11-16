import { z } from "zod";
import { AssetAdministrationShellCreateDtoSchema } from "../aas/asset-administration-shell-json-schema";
import { DigitalProductDocumentDtoSchema } from "../digital-product-document/digital-product-document.schemas";
import {
  EditingModeDtoEnum,
  PassportEditingModeDto,
} from "../digital-product-document/editing-mode.dto";
import { PagingMetadataDtoSchema } from "../shared/pagination.dto";

export const TemplateDtoSchema = DigitalProductDocumentDtoSchema.extend({
  /** Derived from the template's status: Full while a draft, ReadOnly once published or archived. */
  editingMode: EditingModeDtoEnum,
});

export type TemplateDto = z.infer<typeof TemplateDtoSchema>;

export const RestrictPassportEditingDtoSchema = z.object({
  mode: z.literal(PassportEditingModeDto.DataOnly),
});
export type RestrictPassportEditingDto = z.infer<typeof RestrictPassportEditingDtoSchema>;

export const TemplatePaginationDtoSchema = z
  .object({
    ...PagingMetadataDtoSchema.shape,
    result: TemplateDtoSchema.array(),
  })
  .meta({ id: "Templates" });

export type TemplatePaginationDto = z.infer<typeof TemplatePaginationDtoSchema>;

export const TemplateCreateDtoSchema = z.object({
  environment: z.object({
    assetAdministrationShells: AssetAdministrationShellCreateDtoSchema.array().max(1),
  }),
});
export type TemplateCreateDto = z.input<typeof TemplateCreateDtoSchema>;
