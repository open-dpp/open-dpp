import type { AssetAdministrationShell } from "../../domain/asset-adminstration-shell";
import { File } from "../../domain/submodel-base/file";
import type { ISubmodelElement } from "../../domain/submodel-base/submodel-base";
import type { Submodel } from "../../domain/submodel-base/submodel";

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
