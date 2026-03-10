import { PermissionType } from "@open-dpp/dto";
import { IdShortPath } from "../submodel-base/submodel-base";
import { AasResource, CaslAbility } from "./casl-ability";

export class AasAbility {
  private ability: CaslAbility;

  private constructor(ability: CaslAbility) {
    this.ability = ability;
  }

  static create(data: { ability: CaslAbility }): AasAbility {
    return new AasAbility(data.ability);
  }

  private hasAnyRuleFor(object: IdShortPath) {
    return this.ability.rules.some(rule => rule.conditions?.idShortPath === object.toString());
  }

  can(data: { action: PermissionType; object: IdShortPath }): boolean {
    const specificCan = this.ability.can(data.action, new AasResource(data.object.toString()));
    if (specificCan) {
      return true;
    }
    if (!this.hasAnyRuleFor(data.object)) {
      const parentPath = data.object.getParentPath();
      if (!parentPath.isEmpty()) {
        return this.can({ action: data.action, object: parentPath });
      }
    }
    return false;
  }
}
