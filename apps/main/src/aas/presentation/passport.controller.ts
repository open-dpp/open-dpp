import { Controller } from "@nestjs/common";
import { AasRepository } from "../infrastructure/aas.repository";
import { PassportRepository } from "../infrastructure/passport.repository";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import { AasController } from "./aas.controller";
import { EnvironmentService } from "./environment.service";

@Controller("/organizations/:orgaId/passports")
export class PassportController extends AasController {
  constructor(private readonly passportRepository: PassportRepository, private readonly aasRepository: AasRepository, private readonly submodelRepository: SubmodelRepository) {
    super(new EnvironmentService(passportRepository, aasRepository, submodelRepository));
  }
  // async getSubmodels(): Promise<any> {
  //
  // }
}
