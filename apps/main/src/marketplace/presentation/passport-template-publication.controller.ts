import { Controller, Get } from "@nestjs/common";
import { Public } from "@open-dpp/auth";
import { PassportTemplatePublicationService } from "../infrastructure/passport-template-publication.service";
import * as passportTemplateDto_1 from "./dto/passport-template-publication.dto";

const templatesEndpoint = "templates/passports";

@Controller()
export class PassportTemplatePublicationController {
  constructor(
    private passportTemplateService: PassportTemplatePublicationService,
  ) {}

  @Public()
  @Get(templatesEndpoint)
  async getTemplates() {
    const passportTemplates = await this.passportTemplateService.findAll();
    return passportTemplates.map(pt =>
      passportTemplateDto_1.passportTemplatePublicationToDto(pt),
    );
  }
}
