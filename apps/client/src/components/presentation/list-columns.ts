import type { LanguageType, SubmodelElementCollectionResponseDto } from "@open-dpp/dto";
import { useAasUtils } from "../../composables/aas-utils";

export interface ColumnDef {
  header: string;
  field: string;
  /** Present only for columns that need a minimum width (e.g. File elements). */
  style?: { minWidth: string };
}

const FILE_MIN_WIDTH = "200px";

/**
 * Derives column definitions from the first row of a SubmodelElementCollection list.
 * File-type columns receive an explicit `minWidth` so that images are not squeezed
 * in narrow DataTable cells.
 *
 * Pure function — no Vue reactivity, safe to call from a `computed` or a test.
 */
export function buildColumns(
  content: SubmodelElementCollectionResponseDto[],
): ColumnDef[] {
  if (content.length < 1 || !content[0] || !content[0].value) {
    return [];
  }

  const { parseDisplayName } = useAasUtils();

  return content[0].value.map((collectionElement) => {
    const header = parseDisplayName(collectionElement.displayName);
    const field = collectionElement.idShort;
    const isFile = collectionElement.modelType === "File";

    return isFile ? { header, field, style: { minWidth: FILE_MIN_WIDTH } } : { header, field };
  });
}
