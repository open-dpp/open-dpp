import { randomUUID } from "node:crypto";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { DigitalProductDocumentStatusModificationMethodDto } from "@open-dpp/dto";
import { AasModule } from "../../aas/aas.module";
import { Environment } from "../../aas/domain/environment";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../../aas/infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "../../aas/infrastructure/schemas/submodel.schema";
import { ActivityHistoryModule } from "../../activity-history/activity-history.module";
import { BulkImportConfigService } from "../../bulk-import/application/services/bulk-import-config.service";
import { generateMongoConfig } from "../../database/config";
import { DatabaseModule } from "../../database/database.module";
import { EmailService } from "../../email/email.service";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { OrganizationsModule } from "../../identity/organizations/organizations.module";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { UsersModule } from "../../identity/users/users.module";
import { PresentationConfigurationsModule } from "../../presentation-configurations/presentation-configurations.module";
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../infrastructure/template.schema";
import { TemplateService } from "./template.service";
import { EventEmitterModule } from "@nestjs/event-emitter";

describe("templateService", () => {
  let service: TemplateService;
  let templateRepository: TemplateRepository;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        EventEmitterModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          { name: TemplateDoc.name, schema: TemplateSchema },
          { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
          { name: SubmodelDoc.name, schema: SubmodelSchema },
        ]),
        ActivityHistoryModule,
        AasModule,
        DatabaseModule,
        UsersModule,
        OrganizationsModule,
        PresentationConfigurationsModule,
      ],
      providers: [
        TemplateService,
        TemplateRepository,
        {
          provide: BulkImportConfigService,
          useValue: { deleteAllByTemplateId: vi.fn() },
        },
      ],
    })
      .overrideProvider(EmailService)
      .useValue({
        send: vi.fn(),
      })
      .compile();
    await module.init();

    service = module.get<TemplateService>(TemplateService);
    templateRepository = module.get<TemplateRepository>(TemplateRepository);
  });

  afterAll(async () => {
    await module.close();
  });


  it("modifyTemplateStatus publishes a template", async () => {
    const organizationId = randomUUID();
    const subject = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const template = Template.create({ organizationId, environment: Environment.create({}) });
    await templateRepository.save(template);

    await service.modifyTemplateStatus(
      randomUUID(),
      organizationId,
      template.id,
      { method: DigitalProductDocumentStatusModificationMethodDto.Publish },
      { subject, userId: randomUUID() },
    );

    expect((await templateRepository.findOneOrFail(template.id)).isPublished()).toBeTruthy();
  });
});
