import { Injectable } from "@nestjs/common";
import { PresentationReferenceType } from "@open-dpp/dto";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import { PresentationConfiguration } from "../../domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../infrastructure/presentation-configuration.repository";

@Injectable()
export class PresentationConfigurationService {
  constructor(
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
  ) {}

  async getOrCreateForTemplate(template: Template): Promise<PresentationConfiguration> {
    return await this.presentationConfigurationRepository.findOrCreateByReference({
      referenceType: PresentationReferenceType.Template,
      referenceId: template.id,
      organizationId: template.organizationId,
    });
  }

  async getOrCreateForPassport(passport: Passport): Promise<PresentationConfiguration> {
    return await this.presentationConfigurationRepository.findOrCreateByReference({
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
      organizationId: passport.organizationId,
    });
  }
}
