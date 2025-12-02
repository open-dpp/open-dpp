import { Controller } from "@nestjs/common";
import { AasRepository } from "../infrastructure/aas.repository";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import { TemplateRepository } from "../infrastructure/template.repository";
import { AasController } from "./aas.controller";
import { EnvironmentService } from "./environment.service";

@Controller("/organizations/:orgaId/templates")
export class TemplateController extends AasController {
  constructor(private readonly templateRepository: TemplateRepository, private readonly aasRepository: AasRepository, private readonly submodelRepository: SubmodelRepository) {
    super(new EnvironmentService(templateRepository, aasRepository, submodelRepository));
  }
  // async getSubmodels(): Promise<any> {
  //
  // }
}
