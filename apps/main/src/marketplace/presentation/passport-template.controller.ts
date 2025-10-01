import { Controller, Get } from '@nestjs/common';
import { PassportTemplateService } from '../infrastructure/passport-template.service';
import * as passportTemplateDto_1 from './dto/passport-template.dto';
import { Public } from '@app/auth/public/public.decorator';

const templatesEndpoint = 'templates/passports';

@Controller()
export class PassportTemplateController {
  constructor(private passportTemplateService: PassportTemplateService) {}

  @Public()
  @Get(templatesEndpoint)
  async getTemplates() {
    const passportTemplates = await this.passportTemplateService.findAll();
    return passportTemplates.map((pt) =>
      passportTemplateDto_1.passportTemplateToDto(pt),
    );
  }
}
