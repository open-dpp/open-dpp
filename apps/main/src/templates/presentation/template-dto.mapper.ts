import {
  type TemplateDto,
  TemplateDtoSchema,
  type TemplatePaginationDto,
  TemplatePaginationDtoSchema,
} from "@open-dpp/dto";
import type { PagingResult } from "../../pagination/paging-result";
import type { IConvertableToPlain } from "../../aas/domain/convertable-to-plain";
import type { EditingModeType } from "../../digital-product-document/domain/editing-mode";

/** A `Template`, or a decorated one (e.g. with a populated environment). */
type TemplateLike = IConvertableToPlain & { getEditingMode: () => EditingModeType };

function toTemplatePlain(template: TemplateLike) {
  return { ...template.toPlain(), editingMode: template.getEditingMode() };
}

/**
 * Wire representation of a template. Kept apart from `Template.toPlain()`, which only describes
 * what is persisted: the editing mode is derived from the status and must not be stored.
 */
export function toTemplateDto(template: TemplateLike): TemplateDto {
  return TemplateDtoSchema.parse(toTemplatePlain(template));
}

export function toTemplatePaginationDto(
  pagingResult: PagingResult<TemplateLike>,
): TemplatePaginationDto {
  return TemplatePaginationDtoSchema.parse(pagingResult.toPlainWith(toTemplatePlain));
}
