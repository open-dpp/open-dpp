import { Passport } from "../../passports/domain/passport";
import { Template } from "../../templates/domain/template";
import { AasAbility } from "../domain/security/aas-ability";
import { AasRepository } from "../infrastructure/aas.repository";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import { EnvironmentPopulateDecorator } from "./environment-populate-decorator";

export class DigitalProductPassportIdentifiableEnvironmentPopulateDecorator extends EnvironmentPopulateDecorator {
  constructor(
    private convertable: Passport | Template,
    aasRepository: AasRepository,
    submodelRepository: SubmodelRepository,
    ability: AasAbility,
  ) {
    super(convertable.environment, aasRepository, submodelRepository, ability);
  }

  toPlain(): Record<string, any> {
    return {
      ...this.convertable.toPlain(),
      environment: super.toPlain(),
    };
  }
}
