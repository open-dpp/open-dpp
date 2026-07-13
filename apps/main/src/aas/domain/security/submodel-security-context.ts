import { KeyTypes } from "@open-dpp/dto";
import { IdShortPath } from "../common/id-short-path";
import { Submodel } from "../submodel-base/submodel";
import { PolicyTargetValidity } from "./policy-target-validity";

export class SubmodelSecurityContext {
  private constructor(private readonly submodels: Submodel[]) {}

  static create(data: { submodels: Submodel[] }): SubmodelSecurityContext {
    return new SubmodelSecurityContext(data.submodels);
  }

  checkPolicyTarget(object: IdShortPath): PolicyTargetValidity {
    const submodel = this.submodels.find((s) => s.idShort === object.first);
    if (!submodel) {
      return PolicyTargetValidity.unresolvable(`Submodel "${object.first}" not found`);
    }

    const relativePath = object.slice(1);
    if (relativePath.isEmpty()) {
      return PolicyTargetValidity.valid();
    }

    const element = submodel.findSubmodelElement(relativePath);
    if (!element) {
      return PolicyTargetValidity.unresolvable(
        `Submodel element "${object.toString()}" not found`,
      );
    }

    const ancestorTablePaths = element
      .getReference()
      .constructIdShortPathsForType(KeyTypes.SubmodelElementList)
      .filter((path) => !path.isEqual(object));

    return ancestorTablePaths.length > 0
      ? PolicyTargetValidity.invalid(
          `"${object.toString()}" is inside a table and cannot have its own policy`,
        )
      : PolicyTargetValidity.valid();
  }
}
