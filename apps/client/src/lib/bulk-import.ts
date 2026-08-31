import { cloneDeep, unset } from "lodash";
import type { MappingRow } from "../composables/bulk-import/bulk-import-mapping.ts";
import type {
  BulkImportRowDto,
  SubmodelElementSharedResponseDto,
  SubmodelResponseDto,
} from "@open-dpp/dto";
import { AasSubmodelElements, SubmodelElementSharedSchema } from "@open-dpp/dto";
import { type MaybeRefOrGetter, toValue } from "vue";
import { z } from "zod";
import { idShortPathRoot, type IdShortPath } from "./id-short-path.ts";

const CONTAINER_MODEL_TYPES: string[] = [
  AasSubmodelElements.SubmodelElementCollection,
  AasSubmodelElements.SubmodelElementList,
];

const ContainerChildrenSchema = z.object({ value: SubmodelElementSharedSchema.array() });

export function removeMappingsFromRow(
  rowRaw: MaybeRefOrGetter<BulkImportRowDto | null>,
  mappings: MaybeRefOrGetter<MappingRow[]>,
) {
  const rowAsValue = toValue(rowRaw);
  const row = rowAsValue ? cloneDeep(rowAsValue) : {};
  const mappingsAsValue = toValue(mappings);
  if (mappingsAsValue.length > 0) {
    mappingsAsValue.forEach((fieldMapping) => {
      unset(row, fieldMapping.input);
    });
  }
  return row;
}

function filterMappedElements(
  elements: SubmodelElementSharedResponseDto[],
  path: IdShortPath,
  mappedPaths: Set<string>,
): SubmodelElementSharedResponseDto[] {
  return elements
    .filter((element) => !mappedPaths.has(path.addPathSegment(element.idShort).toString()))
    .map((element) => {
      if (!CONTAINER_MODEL_TYPES.includes(element.modelType)) return element;
      const children = ContainerChildrenSchema.parse(element).value;
      const childPath = path.addPathSegment(element.idShort);
      return { ...element, value: filterMappedElements(children, childPath, mappedPaths) };
    });
}

export function removeMappingsFromSubmodels(
  submodelsRaw: MaybeRefOrGetter<SubmodelResponseDto[]>,
  mappings: MaybeRefOrGetter<MappingRow[]>,
) {
  const submodels = cloneDeep(toValue(submodelsRaw));
  const mappingsAsValue = toValue(mappings);
  if (mappingsAsValue.length === 0) return submodels;

  const mappedPathsBySubmodel = new Map<string, Set<string>>();
  mappingsAsValue.forEach((mapping) => {
    const paths = mappedPathsBySubmodel.get(mapping.submodelIdShort) ?? new Set<string>();
    paths.add(mapping.output);
    mappedPathsBySubmodel.set(mapping.submodelIdShort, paths);
  });

  return submodels.map((submodel) => {
    const mappedPaths = mappedPathsBySubmodel.get(submodel.idShort);
    if (!mappedPaths) return submodel;
    return {
      ...submodel,
      submodelElements: filterMappedElements(
        submodel.submodelElements,
        idShortPathRoot,
        mappedPaths,
      ),
    };
  });
}
