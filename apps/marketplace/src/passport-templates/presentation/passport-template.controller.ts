import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { PassportTemplateService } from '../infrastructure/passport-template.service';
import * as passportTemplateDto_1 from './dto/passport-template.dto';
import { PassportTemplate } from '../domain/passport-template';
import { PermissionService } from '@app/permission';
import * as authRequest from '@app/auth/auth-request';
import { Public } from '@app/auth/public/public.decorator';
import { NotFoundInDatabaseException } from '@app/exception/service.exceptions';

const templatesEndpoint = 'templates/passports';

@Controller()
export class PassportTemplateController {
  constructor(
    private passportTemplateService: PassportTemplateService,
    private permissionsService: PermissionService,
  ) {}

  @Post('organizations/:organizationId/templates/passports')
  async createTemplate(
    @Param('organizationId') organizationId: string,
    @Request() req: authRequest.AuthRequest,
    @Body() body: passportTemplateDto_1.PassportTemplateCreateDto,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    const passportTemplateDto =
      passportTemplateDto_1.PassportTemplateCreateSchema.parse(body);
    const passportTemplate = await this.passportTemplateService.save(
      PassportTemplate.create({
        ...passportTemplateDto,
        contactEmail: req.authContext.keycloakUser.email,
        isOfficial: false,
        ownedByOrganizationId: organizationId,
        createdByUserId: req.authContext.keycloakUser.sub,
      }),
    );
    return passportTemplateDto_1.passportTemplateToDto(passportTemplate);
  }

  @Public()
  @Get(`${templatesEndpoint}/:id`)
  async findTemplate(@Param('id') id: string) {
    try {
      return passportTemplateDto_1.passportTemplateToDto(
        await this.passportTemplateService.findOneOrFail(id),
      );
    } catch (error) {
      if (error instanceof NotFoundInDatabaseException) {
        throw new NotFoundException(
          `Passport template with id ${id} could not be found.`,
        );
      }
      throw error;
    }
  }

  @Public()
  @Get(templatesEndpoint)
  async getTemplates() {
    try {
      const passportTemplates = await this.passportTemplateService.findAll();
      return passportTemplates.map((pt) =>
        passportTemplateDto_1.passportTemplateToDto(pt),
      );
    } catch (error) {
      // Log the error or handle it as needed
      throw error;
    }
  }
}
