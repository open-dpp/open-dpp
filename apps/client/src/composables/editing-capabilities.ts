import {
  type DigitalProductDocumentDto,
  PassportDtoSchema,
  TemplateDtoSchema,
  DigitalProductDocumentStatusDto,
  type DigitalProductDocumentStatusDtoType,
  EditingModeDto,
  type EditingModeDtoType,
} from "@open-dpp/dto";
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../lib/digital-product-document.ts";

/** The editing mode a document reports: derived for templates, stored for passports. */
export function useEditingMode(
  type: DigitalProductDocumentTypeType,
  model: MaybeRefOrGetter<DigitalProductDocumentDto | undefined>,
) {
  return computed(() =>
    type === DigitalProductDocumentType.Template
      ? TemplateDtoSchema.optional().parse(toValue(model))?.editingMode
      : PassportDtoSchema.optional().parse(toValue(model))?.editingMode,
  );
}

/**
 * What the user may change on a digital product document, derived from its editing mode and
 * status. An archived document is read-only whatever its editing mode says.
 *
 * - `canEditStructure`: shells, submodels, elements, columns, presentation.
 * - `canEditData`: values, and rows of a table (rows are repeating values).
 */
export function useEditingCapabilities(
  editingMode: MaybeRefOrGetter<EditingModeDtoType | undefined>,
  status: MaybeRefOrGetter<DigitalProductDocumentStatusDtoType | undefined>,
) {
  const isArchived = computed(() => toValue(status) === DigitalProductDocumentStatusDto.Archived);
  const mode = computed(() => toValue(editingMode) ?? EditingModeDto.Full);

  const canEditStructure = computed(() => !isArchived.value && mode.value === EditingModeDto.Full);
  const canEditData = computed(() => !isArchived.value && mode.value !== EditingModeDto.ReadOnly);
  /** Nothing can be changed: archived, or a locked (published/archived) template. */
  const isReadOnly = computed(() => !canEditData.value);
  /** Values can change but the structure is fixed by the template. */
  const isEditingRestrictedToData = computed(() => canEditData.value && !canEditStructure.value);

  return { canEditStructure, canEditData, isReadOnly, isEditingRestrictedToData };
}
