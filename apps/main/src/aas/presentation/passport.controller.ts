import { Controller } from "@nestjs/common";
import { PassportRepository } from "../infrastructure/passport.repository";
import { AasController } from "./aas.controller";

@Controller("/organizations/:orgaId/passports")
export class PassportController extends AasController {
  constructor(private readonly passportRepository: PassportRepository) {
    super(passportRepository);
  }
  // async getSubmodels(): Promise<any> {
  //
  // }
}
