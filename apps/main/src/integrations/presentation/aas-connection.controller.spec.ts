import type { INestApplication } from '@nestjs/common'
import type { TemplateDbProps } from '../../templates/domain/template'
import { randomUUID } from 'node:crypto'
import { expect } from '@jest/globals'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD, Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthContext } from '@open-dpp/auth/auth-request'
import { PermissionModule } from '@open-dpp/permission'
import { json } from 'express'
import request from 'supertest'
import getKeycloakAuthToken from '../../../test/auth-token-helper.testing'
import { KeycloakAuthTestingGuard } from '../../../test/keycloak-auth.guard.testing'
import { KeycloakResourcesServiceTesting } from '../../../test/keycloak.resources.service.testing'
import { MongooseTestingModule } from '../../../test/mongo.testing.module'
import { TypeOrmTestingModule } from '../../../test/typeorm.testing.module'
import { GranularityLevel } from '../../data-modelling/domain/granularity-level'
import { ItemsService } from '../../items/infrastructure/items.service'
import { KeycloakResourcesService } from '../../keycloak-resources/infrastructure/keycloak-resources.service'
import { Model } from '../../models/domain/model'
import { ModelsService } from '../../models/infrastructure/models.service'
import { Organization } from '../../organizations/domain/organization'
import { OrganizationEntity } from '../../organizations/infrastructure/organization.entity'
import { OrganizationsService } from '../../organizations/infrastructure/organizations.service'
import { Template } from '../../templates/domain/template'
import { dataFieldDbPropsFactory } from '../../templates/fixtures/data-field.factory'
import { laptopFactory } from '../../templates/fixtures/laptop.factory'
import { sectionDbPropsFactory } from '../../templates/fixtures/section.factory'
import { TemplateService } from '../../templates/infrastructure/template.service'
import { UniqueProductIdentifierService } from '../../unique-product-identifier/infrastructure/unique-product-identifier.service'
import { UserEntity } from '../../users/infrastructure/user.entity'
import { UsersService } from '../../users/infrastructure/users.service'
import { AasConnection, AasFieldAssignment } from '../domain/aas-connection'
import { AssetAdministrationShellType } from '../domain/asset-administration-shell'
import { semitrailerTruckAas } from '../domain/semitrailer-truck-aas'
import { AasConnectionService } from '../infrastructure/aas-connection.service'
import { IntegrationModule } from '../integration.module'

describe('aasConnectionController', () => {
  let app: INestApplication
  const reflector: Reflector = new Reflector()
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(
    new Map(),
    reflector,
  )
  let templateService: TemplateService
  let aasConnectionService: AasConnectionService
  let modelsService: ModelsService
  let itemsSevice: ItemsService
  let uniqueProductIdentifierService: UniqueProductIdentifierService
  let configService: ConfigService

  const authContext = new AuthContext()
  authContext.keycloakUser = {
    sub: randomUUID(),
    email: 'test@test.test',
    name: 'Test',
    preferred_username: 'test@test.test',
    email_verified: true,
    memberships: [],
  }
  const organizationId = randomUUID()

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmTestingModule,
        TypeOrmModule.forFeature([UserEntity, OrganizationEntity]),
        MongooseTestingModule,
        IntegrationModule,
        PermissionModule,
      ],
      providers: [
        OrganizationsService,
        UsersService,
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
        {
          provide: KeycloakResourcesService,
          useValue: KeycloakResourcesServiceTesting.fromPlain({
            users: [
              {
                id: authContext.keycloakUser.sub,
                email: authContext.keycloakUser.email,
              },
            ],
          }),
        },
      ],
    })
      .overrideProvider(KeycloakResourcesService)
      .useValue(
        KeycloakResourcesServiceTesting.fromPlain({
          users: [
            {
              id: authContext.keycloakUser.sub,
              email: authContext.keycloakUser.email,
            },
          ],
        }),
      )
      .compile()

    app = moduleRef.createNestApplication()

    app.use(
      '/organizations/:organizationId/integration/aas/:aasMappingId',
      json({ limit: '50mb' }),
    )

    templateService = moduleRef.get(TemplateService)
    aasConnectionService = moduleRef.get(AasConnectionService)
    modelsService = moduleRef.get(ModelsService)
    itemsSevice = moduleRef.get(ItemsService)
    const organizationService = moduleRef.get(OrganizationsService)
    await organizationService.save(
      Organization.fromPlain({
        id: organizationId,
        name: 'orga name',
        members: [authContext.user],
        createdByUserId: authContext.keycloakUser.sub,
        ownedByUserId: authContext.keycloakUser.sub,
      }),
    )
    uniqueProductIdentifierService = moduleRef.get(
      UniqueProductIdentifierService,
    )
    configService = moduleRef.get(ConfigService)

    await app.init()
  })
  beforeEach(() => {
    jest.spyOn(reflector, 'get').mockReturnValue(false)
  })

  const sectionId1 = randomUUID()
  const dataFieldId1 = randomUUID()

  const laptopModel: TemplateDbProps = laptopFactory.build({
    organizationId,
    userId: authContext.keycloakUser.sub,
    sections: [
      sectionDbPropsFactory.build({
        id: sectionId1,
        name: 'Carbon Footprint',
        dataFields: [
          dataFieldDbPropsFactory.build({
            id: dataFieldId1,
            name: 'PCFCalculationMethod',
            granularityLevel: GranularityLevel.ITEM,
          }),
        ],
      }),
    ],
  })

  it(`/CREATE items via connection`, async () => {
    jest.spyOn(reflector, 'get').mockReturnValue(true)
    const template = Template.loadFromDb(laptopModel)
    await templateService.save(template)
    const model = Model.create({
      organizationId,
      userId: authContext.keycloakUser.sub,
      name: 'Laptop',
      template,
    })
    const aasMapping = AasConnection.create({
      name: 'Connection Name',
      organizationId,
      userId: authContext.keycloakUser.sub,
      dataModelId: template.id,
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
      modelId: model.id,
    })
    const fieldMapping = AasFieldAssignment.create({
      sectionId: sectionId1,
      dataFieldId: dataFieldId1,
      idShortParent: 'ProductCarbonFootprint_A1A3',
      idShort: 'PCFCO2eq',
    })
    aasMapping.addFieldAssignment(fieldMapping)
    await modelsService.save(model)
    await aasConnectionService.save(aasMapping)

    const globalAssetId = `Semitrailer_Truck_-10204004-0010-02_${randomUUID()}`
    const response = await request(app.getHttpServer())
      .post(
        `/organizations/${organizationId}/integration/aas/connections/${aasMapping.id}/items`,
      )
      .set('API_TOKEN', configService.get('API_TOKEN'))
      .send({
        ...semitrailerTruckAas,
        assetAdministrationShells: [
          {
            ...semitrailerTruckAas.assetAdministrationShells[0],
            assetInformation: {
              assetKind: 'Instance',
              assetType: 'product',
              globalAssetId,
            },
          },
        ],
      })
    expect(response.status).toEqual(201)
    expect(response.body.dataValues).toEqual([
      {
        dataSectionId: sectionId1,
        dataFieldId: dataFieldId1,
        value: '2.6300',
        row: 0,
      },
    ])
    const foundUniqueProductIdentifier
      = await uniqueProductIdentifierService.findOneOrFail(globalAssetId)
    const item = await itemsSevice.findOneOrFail(
      foundUniqueProductIdentifier.referenceId,
    )
    expect(item.modelId).toEqual(model.id)
    expect(item.templateId).toEqual(template.id)
  })

  it(`/CREATE connection`, async () => {
    const template = Template.loadFromDb(laptopModel)
    await templateService.save(template)
    const model = Model.create({
      organizationId,
      userId: authContext.keycloakUser.sub,
      name: 'Laptop',
      template,
    })
    await modelsService.save(model)

    const body = {
      name: 'Connection Name',
      dataModelId: template.id,
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
      modelId: model.id,
      fieldAssignments: [
        {
          sectionId: sectionId1,
          dataFieldId: dataFieldId1,
          idShortParent: 'ProductCarbonFootprint_A1A3',
          idShort: 'PCFCO2eq',
        },
      ],
    }

    const response = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/integration/aas/connections`)
      .set(
        'Authorization',
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      )
      .send(body)
    expect(response.status).toEqual(201)
    expect(response.body.dataModelId).toEqual(template.id)
    expect(response.body.aasType).toEqual(
      AssetAdministrationShellType.Semitrailer_Truck,
    )
    expect(response.body.name).toEqual('Connection Name')
    expect(response.body.modelId).toEqual(model.id)
    expect(response.body.fieldAssignments).toEqual(body.fieldAssignments)
  })

  it(`/UPDATE connection`, async () => {
    const aasConnection = AasConnection.create({
      name: 'Connection Name',
      organizationId,
      userId: authContext.keycloakUser.sub,
      dataModelId: randomUUID(),
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
      modelId: randomUUID(),
    })
    await aasConnectionService.save(aasConnection)

    const template = Template.loadFromDb(laptopModel)
    await templateService.save(template)
    const model = Model.create({
      organizationId,
      userId: authContext.keycloakUser.sub,
      name: 'Laptop',
      template,
    })
    await modelsService.save(model)

    const body = {
      name: 'Other Name',
      modelId: model.id,
      fieldAssignments: [
        {
          sectionId: sectionId1,
          dataFieldId: dataFieldId1,
          idShortParent: 'ProductCarbonFootprint_A1A3',
          idShort: 'PCFCO2eq',
        },
      ],
    }

    const response = await request(app.getHttpServer())
      .patch(
        `/organizations/${organizationId}/integration/aas/connections/${aasConnection.id}`,
      )
      .set(
        'Authorization',
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      )
      .send(body)
    expect(response.status).toEqual(200)
    expect(response.body.name).toEqual('Other Name')
    expect(response.body.modelId).toEqual(model.id)
    expect(response.body.dataModelId).toEqual(template.id)
    expect(response.body.fieldAssignments).toEqual(body.fieldAssignments)
  })

  it(`/GET all properties of aas`, async () => {
    jest.spyOn(reflector, 'get').mockReturnValue(false)

    const response = await request(app.getHttpServer())
      .get(
        `/organizations/${organizationId}/integration/aas/${AssetAdministrationShellType.Semitrailer_Truck}/properties`,
      )
      .set(
        'Authorization',
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      )
      .send(semitrailerTruckAas)
    expect(response.status).toEqual(200)
    expect(response.body).toContainEqual({
      parentIdShort: 'Nameplate',
      property: {
        idShort: 'URIOfTheProduct',
        modelType: 'Property',
        value: '0112/2///61987#TR590#900',
        valueType: 'xs:string',
      },
    })
    expect(response.body).toContainEqual({
      parentIdShort: 'AddressInformation',
      property: {
        idShort: 'Company',
        modelType: 'Property',
        value: 'Proalpha GmbH',
        valueType: 'xs:string',
      },
    })
  })

  it(`/GET all connections of organization`, async () => {
    const otherOrganizationId = randomUUID()
    const aasConnection1 = AasConnection.create({
      name: 'Connection Name 1',
      organizationId: otherOrganizationId,
      userId: authContext.keycloakUser.sub,
      dataModelId: randomUUID(),
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
      modelId: randomUUID(),
    })
    const aasConnection2 = AasConnection.create({
      name: 'Connection Name 2',
      organizationId: otherOrganizationId,
      userId: authContext.keycloakUser.sub,
      dataModelId: randomUUID(),
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
      modelId: randomUUID(),
    })
    await aasConnectionService.save(aasConnection1)
    await aasConnectionService.save(aasConnection2)

    const response = await request(app.getHttpServer())
      .get(`/organizations/${otherOrganizationId}/integration/aas/connections`)
      .set(
        'Authorization',
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [otherOrganizationId],
          keycloakAuthTestingGuard,
        ),
      )
    expect(response.status).toEqual(200)
    expect(response.body).toEqual([
      {
        id: aasConnection1.id,
        name: 'Connection Name 1',
      },
      {
        id: aasConnection2.id,
        name: 'Connection Name 2',
      },
    ])
  })

  afterAll(async () => {
    await app.close()
  })
})
