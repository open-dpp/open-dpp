import { Controller, Get } from "@nestjs/common";
import { AllowAnonymous } from "../../identity/auth/presentation/decorators/allow-anonymous.decorator";
import { PassportTemplatePublicationService } from "../infrastructure/passport-template-publication.service";
import * as passportTemplateDto_1 from "./dto/passport-template-publication.dto";

const templatesEndpoint = "templates/passports";

@Controller()
export class PassportTemplatePublicationController {
  constructor(
    private passportTemplateService: PassportTemplatePublicationService,
  ) {}

  @AllowAnonymous()
  @Get(templatesEndpoint)
  async getTemplates() {
    const passportTemplates = await this.passportTemplateService.findAll();
    return passportTemplates.map(pt =>
      passportTemplateDto_1.passportTemplatePublicationToDto(pt),
    );
  }
}
