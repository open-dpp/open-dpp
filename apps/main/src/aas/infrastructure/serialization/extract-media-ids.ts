import type { AssetAdministrationShell } from "../../domain/asset-adminstration-shell";
import type { Submodel } from "../../domain/submodel-base/submodel";
import type { ISubmodelElement } from "../../domain/submodel-base/submodel-base";
import { File } from "../../domain/submodel-base/file";

function collectFileValues(elements: ISubmodelElement[], ids: Set<string>): void {
  const stack: ISubmodelElement[] = [...elements];
  while (stack.length > 0) {
    const element = stack.pop()!;
    if (element instanceof File && element.value) {
      ids.add(element.value);
    }
    stack.push(...element.getSubmodelElements());
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
