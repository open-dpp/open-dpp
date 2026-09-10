import { randomUUID } from "node:crypto";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { jest } from "@jest/globals";
import { AasModule } from "../../aas/aas.module";
import { Environment } from "../../aas/domain/environment";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../../aas/infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "../../aas/infrastructure/schemas/submodel.schema";
import { ActivityHistoryModule } from "../../activity-history/activity-history.module";
import { ActivityRepository } from "../../activity-history/infrastructure/activity.repository";
import { ActivityTypes } from "../../activity-history/domain/activities/activity-types";
import { BulkImportConfigService } from "../../bulk-import/application/services/bulk-import-config.service";
import { generateMongoConfig } from "../../database/config";
import { DatabaseModule } from "../../database/database.module";
import { PassportEditingMode } from "../../digital-product-document/domain/passport-editing-mode";
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

describe("templateService", () => {
  let service: TemplateService;
  let templateRepository: TemplateRepository;
  let activityRepository: ActivityRepository;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
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
          useValue: { deleteAllByTemplateId: jest.fn() },
        },
      ],
    })
      .overrideProvider(EmailService)
      .useValue({
        send: jest.fn(),
      })
      .compile();
    await module.init();

    service = module.get<TemplateService>(TemplateService);
    templateRepository = module.get<TemplateRepository>(TemplateRepository);
    activityRepository = module.get<ActivityRepository>(ActivityRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  it("restrictPassportEditingToData restricts the template and records an activity", async () => {
    const organizationId = randomUUID();
    const subject = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const template = Template.create({ organizationId, environment: Environment.create({}) });
    await templateRepository.save(template);

    await service.restrictPassportEditingToData(randomUUID(), organizationId, template.id, {
      subject,
      userId: randomUUID(),
    });

    // Note: the returned DTO doesn't expose `passportEditingMode` yet — that's
    // TemplateDtoSchema's job (commit 11) — so assert on the persisted entity instead.
    const persisted = await templateRepository.findOneOrFail(template.id);
    expect(persisted.getPassportEditingMode()).toEqual(PassportEditingMode.DataOnly);

    const activities = await activityRepository.findByAggregateId(template.id, {
      filter: { activityType: ActivityTypes.PassportEditingModeChanged },
    });
    expect(activities.items).toHaveLength(1);
  });

  it("restrictPassportEditingToData throws when already restricted", async () => {
    const organizationId = randomUUID();
    const subject = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const template = Template.create({ organizationId, environment: Environment.create({}) });
    template.restrictPassportEditingToData();
    await templateRepository.save(template);

    await expect(
      service.restrictPassportEditingToData(randomUUID(), organizationId, template.id, {
        subject,
        userId: randomUUID(),
      }),
    ).rejects.toThrow("Passport editing is already restricted to data for this template.");
  });
});
