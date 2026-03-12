import { PermissionType } from "@open-dpp/dto";
import { AasResource, CaslAbility } from "./casl-ability";

export class AasAbility {
  private ability: CaslAbility;

  private constructor(ability: CaslAbility) {
    this.ability = ability;
  }

  static create(data: { ability: CaslAbility }): AasAbility {
    return new AasAbility(data.ability);
  }

  private hasAnyRuleFor(object: AasResource) {
    return this.ability.rules.some(rule =>
      rule.conditions?.idShortPath === object.idShortPath.toString()
      && rule.conditions?.organizationId === object.organizationId,
    );
  }

  can(data: { action: PermissionType; object: AasResource }): boolean {
    const specificCan = this.ability.can(data.action, data.object);
    if (specificCan) {
      return true;
    }
    if (!this.hasAnyRuleFor(data.object)) {
      const parentAasResource = data.object.getParentAasResource();
      if (parentAasResource !== undefined) {
        return this.can({ action: data.action, object: parentAasResource });
      }
    }
    return false;
  }
}
