import type { AssetAdministrationShell } from "../../domain/asset-adminstration-shell";
import type { Submodel } from "../../domain/submodel-base/submodel";
import type { ISubmodelElement } from "../../domain/submodel-base/submodel-base";
import { File } from "../../domain/submodel-base/file";

function collectFileValues(elements: ISubmodelElement[], ids: Set<string>): void {
  for (const element of elements) {
    if (element instanceof File && element.value) {
      ids.add(element.value);
    }
    collectFileValues(element.getSubmodelElements(), ids);
  }
}

export function extractMediaIds(
  shells: AssetAdministrationShell[],
  submodels: Submodel[],
): string[] {
  const ids = new Set<string>();

  for (const shell of shells) {
    for (const thumbnail of shell.assetInformation.defaultThumbnails) {
      if (thumbnail.path) {
        ids.add(thumbnail.path);
      }
    }
  }

  for (const submodel of submodels) {
    collectFileValues(submodel.getSubmodelElements(), ids);
  }

  return [...ids];
}
