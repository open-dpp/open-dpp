import { randomUUID } from "node:crypto";
import { beforeAll, expect } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import getKeycloakAuthToken, {
  createKeycloakUserInToken,
  getApp,
  KeycloakAuthTestingGuard,
  KeycloakResourcesServiceTesting,
  MongooseTestingModule,
} from "@open-dpp/testing";
import request from "supertest";
import TestUsersAndOrganizations from "../../../test/test-users-and-orgs";
import { DataFieldType } from "../../data-modelling/domain/data-field-base";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { SectionType } from "../../data-modelling/domain/section-base";
import { Sector } from "../../data-modelling/domain/sectors";
import { sectionToDto } from "../../data-modelling/presentation/dto/section-base.dto";
import { KeycloakResourcesService } from "../../keycloak-resources/infrastructure/keycloak-resources.service";
import {
  PassportTemplatePublicationDbSchema,
  PassportTemplatePublicationDoc,
} from "../../marketplace/infrastructure/passport-template-publication.schema";
import {
  PassportTemplatePublicationService,
} from "../../marketplace/infrastructure/passport-template-publication.service";
import { MarketplaceApplicationService } from "../../marketplace/presentation/marketplace.application.service";
import { Organization } from "../../organizations/domain/organization";
import { OrganizationDbSchema, OrganizationDoc } from "../../organizations/infrastructure/organization.schema";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import {
  TemplateDoc,
  TemplateSchema,
} from "../../templates/infrastructure/template.schema";
import { TemplateService } from "../../templates/infrastructure/template.service";
import { User } from "../../users/domain/user";

import { InjectUserToAuthContextGuard } from "../../users/infrastructure/inject-user-to-auth-context.guard";
import { UserDbSchema, UserDoc } from "../../users/infrastructure/user.schema";
import { UsersService } from "../../users/infrastructure/users.service";
import { DataFieldDraft } from "../domain/data-field-draft";
import { SectionDraft } from "../domain/section-draft";
import { MoveDirection, TemplateDraft } from "../domain/template-draft";
import { dataFieldDraftDbPropsFactory } from "../fixtures/data-field-draft.factory";
import { sectionDraftDbPropsFactory } from "../fixtures/section-draft.factory";
import {
  templateDraftCreateDtoFactory,
  templateDraftCreatePropsFactory,
} from "../fixtures/template-draft.factory";
import {
  TemplateDraftDoc,
  TemplateDraftSchema,
} from "../infrastructure/template-draft.schema";
import { TemplateDraftService } from "../infrastructure/template-draft.service";
import { MoveType } from "./dto/move.dto";
import { VisibilityLevel } from "./dto/publish.dto";
import { templateDraftToDto } from "./dto/template-draft.dto";
import { TemplateDraftController } from "./template-draft.controller";

describe("templateDraftController", () => {
  let app: INestApplication;
  let templateDraftService: TemplateDraftService;
  let templateService: TemplateService;
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(new Map());
  let module: TestingModule;
  let usersService: UsersService;
  let organizationService: OrganizationsService;
  let marketplaceService: MarketplaceApplicationService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: TemplateDraftDoc.name,
            schema: TemplateDraftSchema,
          },
          {
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
          {
            name: PassportTemplatePublicationDoc.name,
            schema: PassportTemplatePublicationDbSchema,
          },
          {
            name: OrganizationDoc.name,
            schema: OrganizationDbSchema,
          },
          {
            name: UserDoc.name,
            schema: UserDbSchema,
          },
        ]),
      ],
      providers: [
        TemplateService,
        TemplateDraftService,
        MarketplaceApplicationService,
        PassportTemplatePublicationService,
        OrganizationsService,
        UsersService,
        KeycloakResourcesService,
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
        {
          provide: APP_GUARD,
          useClass: InjectUserToAuthContextGuard,
        },
      ],
      controllers: [TemplateDraftController],
    })
      .overrideProvider(KeycloakResourcesService)
      .useValue(
        KeycloakResourcesServiceTesting.fromPlain({
          users: [
            {
              id: TestUsersAndOrganizations.keycloakUsers.keycloakUser1.sub,
              email: TestUsersAndOrganizations.keycloakUsers.keycloakUser1.email,
            },
          ],
        }),
      )
      .compile();

    app = module.createNestApplication();

    templateService = module.get<TemplateService>(TemplateService);
    templateDraftService
      = module.get<TemplateDraftService>(TemplateDraftService);
    marketplaceService = module.get<MarketplaceApplicationService>(
      MarketplaceApplicationService,
    );

    usersService
      = module.get<UsersService>(UsersService);
    organizationService
      = module.get<OrganizationsService>(OrganizationsService);

    await app.init();

    await usersService.save(TestUsersAndOrganizations.users.user1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org2);
  });

  const userNotMemberTxt = `fails if user is not member of organization`;
  const draftDoesNotBelongToOrga = `fails if draft does not belong to organization`;

  it(`/CREATE template draft`, async () => {
    const body = templateDraftCreateDtoFactory.build();
    const response = await request(getApp(app))
      .post(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(201);
    expect(response.body.id).toBeDefined();
    const found = await templateDraftService.findOneOrFail(response.body.id);
    expect(response.body).toEqual(templateDraftToDto(found));
  });

  it(`/CREATE template draft ${userNotMemberTxt}`, async () => {
    const body = templateDraftCreateDtoFactory.build();

    const response = await request(getApp(app))
      .post(`/organizations/${TestUsersAndOrganizations.organizations.org2.id}/template-drafts`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/PATCH template draft`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );

    await templateDraftService.save(laptopDraft);
    const body = templateDraftCreateDtoFactory.build();
    const response = await request(getApp(app))
      .patch(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      ...templateDraftToDto(laptopDraft),
      ...body,
    });
  });

  it(`/PATCH template draft ${userNotMemberTxt}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );

    await templateDraftService.save(laptopDraft);
    const body = templateDraftCreateDtoFactory.build();
    const response = await request(getApp(app))
      .patch(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/template-drafts/${laptopDraft.id}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/PATCH template draft ${draftDoesNotBelongToOrga}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);
    const body = templateDraftCreateDtoFactory.build();
    const response = await request(getApp(app))
      .patch(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/PUBLISH template draft`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );

    const section = SectionDraft.create({
      name: "Technical Specs",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    laptopDraft.addSection(section);

    const dataField = DataFieldDraft.create({
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });
    laptopDraft.addDataFieldToSection(section.id, dataField);
    await templateDraftService.save(laptopDraft);

    const body = {
      visibility: VisibilityLevel.PUBLIC,
    };
    const spyUpload = jest.spyOn(marketplaceService, "upload");

    const token = getKeycloakAuthToken(
      TestUsersAndOrganizations.users.user1.keycloakUserId,
      keycloakAuthTestingGuard,
    );

    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/publish`,
      )
      .set("Authorization", token)
      .send(body);
    expect(response.status).toEqual(201);
    const foundDraft = await templateDraftService.findOneOrFail(
      response.body.id,
    );
    expect(foundDraft.publications).toEqual([
      { id: expect.any(String), version: "1.0.0" },
    ]);
    const foundTemplate = await templateService.findOneOrFail(
      foundDraft.publications[0].id,
    );
    expect(foundTemplate.id).toEqual(foundDraft.publications[0].id);

    expect(foundTemplate.marketplaceResourceId).toBeDefined();
    expect(spyUpload).toHaveBeenCalledWith(foundTemplate, TestUsersAndOrganizations.users.user1);
  });

  it(`/PUBLISH template draft ${userNotMemberTxt}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    const body = {
      visibility: VisibilityLevel.PUBLIC,
      sectors: [Sector.TEXTILE],
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/template-drafts/${laptopDraft.id}/publish`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/PUBLISH template draft ${draftDoesNotBelongToOrga}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);
    const body = {
      visibility: VisibilityLevel.PUBLIC,
      sectors: [Sector.TEXTILE],
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/publish`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/GET template drafts of organization`, async () => {
    const keycloakUserTemp = createKeycloakUserInToken();
    const userTemp = User.create({
      email: keycloakUserTemp.email,
      keycloakUserId: keycloakUserTemp.sub,
    });
    const orgTemp = Organization.create({
      name: "organization-temp-test",
      ownedByUserId: userTemp.id,
      createdByUserId: userTemp.id,
      members: [userTemp],
    });
    await usersService.save(userTemp);
    await organizationService.save(orgTemp);
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: orgTemp.id,
        userId: userTemp.id,
      }),
    );
    const phoneDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: orgTemp.id,
        userId: userTemp.id,
      }),
    );
    await templateDraftService.save(laptopDraft);
    await templateDraftService.save(phoneDraft);
    const response = await request(getApp(app))
      .get(`/organizations/${orgTemp.id}/template-drafts`)
      .set(
        "Authorization",
        getKeycloakAuthToken(userTemp.keycloakUserId, keycloakAuthTestingGuard),
      );

    expect(response.status).toEqual(200);
    expect(response.body).toEqual([
      { id: laptopDraft.id, name: laptopDraft.name },
      { id: phoneDraft.id, name: phoneDraft.name },
    ]);
  });

  it(`/GET template drafts of organization ${userNotMemberTxt}`, async () => {
    const response = await request(getApp(app))
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org2.id}/template-drafts`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/CREATE section draft`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);
    const body = {
      name: "Technical Specs",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.sections).toEqual([
      {
        name: "Technical Specs",
        type: SectionType.GROUP,
        granularityLevel: GranularityLevel.MODEL,
        id: expect.any(String),
        dataFields: [],
        subSections: [],
      },
    ]);
    const foundDraft = await templateDraftService.findOneOrFail(
      response.body.id,
    );
    expect(response.body).toEqual(templateDraftToDto(foundDraft));
  });

  it(`/CREATE sub section draft`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );

    const section = SectionDraft.create({
      name: "Technical specification",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    laptopDraft.addSection(section);

    await templateDraftService.save(laptopDraft);

    const body = {
      name: "Dimensions",
      type: SectionType.GROUP,
      parentSectionId: section.id,

      granularityLevel: GranularityLevel.MODEL,
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(201);
    // expect draft data
    const expectedSectionsBody = [
      { ...sectionToDto(section), subSections: [expect.any(String)] },
      {
        name: "Dimensions",
        type: SectionType.GROUP,
        id: expect.any(String),
        dataFields: [],
        subSections: [],
        parentId: section.id,

        granularityLevel: GranularityLevel.MODEL,
      },
    ];
    expect(response.body.sections).toEqual(expectedSectionsBody);
    const found = await templateDraftService.findOneOrFail(response.body.id);
    expect(response.body.sections).toEqual(templateDraftToDto(found).sections);
  });

  it(`/CREATE section draft ${userNotMemberTxt}`, async () => {
    const body = {
      name: "Dimensions",
      type: SectionType.GROUP,
      parentSectionId: undefined,
      granularityLevel: GranularityLevel.MODEL,
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/template-drafts/${randomUUID()}/sections`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/CREATE section draft ${draftDoesNotBelongToOrga}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);
    const body = {
      name: "Dimensions",
      type: SectionType.GROUP,
      parentSectionId: undefined,

      granularityLevel: GranularityLevel.MODEL,
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/GET draft`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );

    const section = SectionDraft.create({
      name: "Tecs",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    laptopDraft.addSection(section);

    await templateDraftService.save(laptopDraft);
    const response = await request(getApp(app))
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(200);
    const found = await templateDraftService.findOneOrFail(response.body.id);
    expect(response.body).toEqual(templateDraftToDto(found));
  });

  it(`/GET draft ${userNotMemberTxt}`, async () => {
    const response = await request(getApp(app))
      .get(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/template-drafts/${randomUUID()}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/GET draft ${draftDoesNotBelongToOrga}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);

    const response = await request(getApp(app))
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/PATCH section draft`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );

    const section = SectionDraft.create({
      name: "Tecs",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    laptopDraft.addSection(section);

    await templateDraftService.save(laptopDraft);

    const body = {
      name: "Technical Specs",
    };
    const response = await request(getApp(app))
      .patch(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/${section.id}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(200);
    const found = await templateDraftService.findOneOrFail(response.body.id);
    expect(sectionToDto(found.findSectionOrFail(section.id))).toEqual({
      ...sectionToDto(section),
      name: body.name,
    });
  });

  it(`/PATCH section draft ${userNotMemberTxt}`, async () => {
    const body = {
      name: "Technical Specs",
    };
    const response = await request(getApp(app))
      .patch(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/template-drafts/${randomUUID()}/sections/${randomUUID()}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/PATCH section draft ${draftDoesNotBelongToOrga}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);
    const body = {
      name: "Technical Specs",
    };
    const response = await request(getApp(app))
      .patch(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/${randomUUID()}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/POST move section`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    const section1 = SectionDraft.create(sectionDraftDbPropsFactory.build());
    const subSection11 = SectionDraft.create(
      sectionDraftDbPropsFactory.build(),
    );
    const section2 = SectionDraft.create(sectionDraftDbPropsFactory.build());
    laptopDraft.addSection(section1);
    laptopDraft.addSubSection(section1.id, subSection11);
    laptopDraft.addSection(section2);

    await templateDraftService.save(laptopDraft);

    const body = {
      type: MoveType.POSITION,
      direction: MoveDirection.UP,
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/${section2.id}/move`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(201);
    const found = await templateDraftService.findOneOrFail(response.body.id);
    expect(found.sections).toEqual([section2, section1, subSection11]);
  });

  it(`/POST move section ${userNotMemberTxt}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);
    const body = {
      type: MoveType.POSITION,
      direction: MoveDirection.UP,
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/template-drafts/${laptopDraft.id}/sections/${randomUUID()}/move`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/POST move section ${draftDoesNotBelongToOrga}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);
    const body = {
      type: MoveType.POSITION,
      direction: MoveDirection.UP,
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/${randomUUID()}/move`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/POST move data field`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    const dataField1 = DataFieldDraft.loadFromDb(
      dataFieldDraftDbPropsFactory.build(),
    );
    const dataField2 = DataFieldDraft.loadFromDb(
      dataFieldDraftDbPropsFactory.build(),
    );
    const dataField3 = DataFieldDraft.loadFromDb(
      dataFieldDraftDbPropsFactory.build(),
    );
    const section1 = SectionDraft.loadFromDb(
      sectionDraftDbPropsFactory
        .addDataField(dataField1)
        .addDataField(dataField2)
        .addDataField(dataField3)
        .build(),
    );

    laptopDraft.addSection(section1);
    await templateDraftService.save(laptopDraft);

    const body = {
      type: MoveType.POSITION,
      direction: MoveDirection.UP,
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/${section1.id}/data-fields/${dataField3.id}/move`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(201);
    const found = await templateDraftService.findOneOrFail(response.body.id);
    expect(found.findSectionOrFail(section1.id).dataFields).toEqual([
      dataField1,
      dataField3,
      dataField2,
    ]);
  });

  it(`/POST move data field ${userNotMemberTxt}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);
    const body = {
      type: MoveType.POSITION,
      direction: MoveDirection.UP,
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/template-drafts/${laptopDraft.id}/sections/${randomUUID()}/data-fields/${randomUUID()}/move`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/POST move data field ${draftDoesNotBelongToOrga}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);
    const body = {
      type: MoveType.POSITION,
      direction: MoveDirection.UP,
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/${randomUUID()}/data-fields/${randomUUID()}/move`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/DELETE section draft`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );

    const section = SectionDraft.create({
      name: "Tecs",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    laptopDraft.addSection(section);
    await templateDraftService.save(laptopDraft);
    const response = await request(getApp(app))
      .delete(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/${section.id}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(200);
    const found = await templateDraftService.findOneOrFail(response.body.id);
    expect(found.sections).toEqual([]);
  });

  it(`/DELETE section draft ${userNotMemberTxt}`, async () => {
    const response = await request(getApp(app))
      .delete(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/template-drafts/${randomUUID()}/sections/${randomUUID()}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/DELETE section draft ${draftDoesNotBelongToOrga}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);

    const response = await request(getApp(app))
      .delete(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/${randomUUID()}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/CREATE data field draft`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    const section = SectionDraft.create({
      name: "Technical Specs",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    laptopDraft.addSection(section);

    await templateDraftService.save(laptopDraft);

    const body = {
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      options: { min: 2 },
      granularityLevel: GranularityLevel.MODEL,
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/${section.id}/data-fields`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.sections[0].dataFields).toEqual([
      {
        name: "Processor",
        type: DataFieldType.TEXT_FIELD,
        id: expect.any(String),
        options: { min: 2 },
        granularityLevel: GranularityLevel.MODEL,
      },
    ]);
    const foundDraft = await templateDraftService.findOneOrFail(
      response.body.id,
    );
    expect(response.body).toEqual(templateDraftToDto(foundDraft));
  });

  it(`/CREATE data field draft ${userNotMemberTxt}`, async () => {
    const body = {
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      options: { min: 2 },

      granularityLevel: GranularityLevel.MODEL,
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/template-drafts/${randomUUID()}/sections/${randomUUID()}/data-fields`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/CREATE data field draft ${draftDoesNotBelongToOrga}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);
    const body = {
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      options: { min: 2 },

      granularityLevel: GranularityLevel.MODEL,
    };
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/${randomUUID()}/data-fields`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/PATCH data field draft`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    const section = SectionDraft.create({
      name: "Technical Specs",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    laptopDraft.addSection(section);
    const dataField = DataFieldDraft.create({
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });
    laptopDraft.addDataFieldToSection(section.id, dataField);

    await templateDraftService.save(laptopDraft);

    const body = {
      name: "Memory",
      type: DataFieldType.NUMERIC_FIELD,
      options: { max: 8 },
    };
    const response = await request(getApp(app))
      .patch(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/${section.id}/data-fields/${dataField.id}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(200);
    const found = await templateDraftService.findOneOrFail(response.body.id);
    expect(found.sections[0].dataFields).toEqual([
      {
        ...dataField,
        _name: body.name,
        _type: body.type,
        _options: body.options,
      },
    ]);
  });

  it(`/PATCH data field draft ${userNotMemberTxt}`, async () => {
    const body = {
      name: "Memory",
      options: { max: 8 },
    };
    const response = await request(getApp(app))
      .patch(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/template-drafts/${randomUUID()}/sections/someId/data-fields/someId`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/PATCH data field draft ${draftDoesNotBelongToOrga}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);
    const body = {
      name: "Memory",
      options: { max: 8 },
    };
    const response = await request(getApp(app))
      .patch(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/someId/data-fields/someId`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/DELETE data field draft`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );

    const section = SectionDraft.create({
      name: "Technical Specs",
      type: SectionType.GROUP,
      granularityLevel: GranularityLevel.MODEL,
    });
    laptopDraft.addSection(section);

    const dataField = DataFieldDraft.create({
      name: "Processor",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    });
    laptopDraft.addDataFieldToSection(section.id, dataField);

    await templateDraftService.save(laptopDraft);
    const response = await request(getApp(app))
      .delete(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/${section.id}/data-fields/${dataField.id}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(200);
    expect(response.body.id).toBeDefined();
    expect(response.body.sections[0].dataFields).toEqual([]);
    const found = await templateDraftService.findOneOrFail(response.body.id);
    expect(response.body).toEqual(templateDraftToDto(found));
  });

  it(`/DELETE data field ${userNotMemberTxt}`, async () => {
    const response = await request(getApp(app))
      .delete(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/template-drafts/${randomUUID()}/sections/${randomUUID()}/data-fields/${randomUUID()}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/DELETE data field ${draftDoesNotBelongToOrga}`, async () => {
    const laptopDraft = TemplateDraft.create(
      templateDraftCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
        userId: TestUsersAndOrganizations.users.user1.id,
      }),
    );
    await templateDraftService.save(laptopDraft);

    const response = await request(getApp(app))
      .delete(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/template-drafts/${laptopDraft.id}/sections/${randomUUID()}/data-fields/${randomUUID()}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  afterAll(async () => {
    await module.close();
    await app.close();
  });
});
