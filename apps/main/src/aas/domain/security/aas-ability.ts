import { MongoAbility } from "@casl/ability";
import { PermissionType } from "@open-dpp/dto";
import { IdShortPath } from "../submodel-base/submodel-base";

export class AasAbility {
  private ability: MongoAbility<[PermissionType, string]>;
  private fieldsWithRules = new Map<string, boolean>();
  private constructor(ability: MongoAbility<[PermissionType, string]>) {
    this.ability = ability;
    for (const rule of ability.rules) {
      if (rule.fields) {
        for (const field of rule.fields) {
          this.fieldsWithRules.set(field, true);
        }
      }
    }
  }

  static create(data: { ability: MongoAbility<[PermissionType, string]> }): AasAbility {
    return new AasAbility(data.ability);
  }

  can(data: { action: PermissionType; object: IdShortPath }): boolean {
    const specificCan = this.ability.can(data.action, "Submodel", data.object.toString());
    if (specificCan) {
      return true;
    }
    if (!this.fieldsWithRules.has(data.object.toString())) {
      return this.can({ action: data.action, object: data.object.getParentPath() });
    }
    return false;
  }
}
