import { Passport } from "../../passports/domain/passport";
import { Template } from "../../templates/domain/template";
import { AasRepository } from "../infrastructure/aas.repository";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import { EnvironmentPopulateDecorator } from "./environment-populate-decorator";

export class DigitalProductPassportIdentifiableEnvironmentPopulateDecorator extends EnvironmentPopulateDecorator {
  constructor(
    private convertable: Passport | Template,
    aasRepository: AasRepository,
    submodelRepository: SubmodelRepository,
  ) {
    super(convertable.environment, aasRepository, submodelRepository);
  }

  toPlain(): Record<string, any> {
    return {
      ...this.convertable.toPlain(),
      environment: super.toPlain(),
    };
  }
}
