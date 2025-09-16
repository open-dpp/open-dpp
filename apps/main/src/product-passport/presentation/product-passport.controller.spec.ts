import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { TemplateService } from '../../templates/infrastructure/template.service';
import { INestApplication } from '@nestjs/common';
import { ModelsService } from '../../models/infrastructure/models.service';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Model } from '../../models/domain/model';
import * as request from 'supertest';
import { KeycloakAuthTestingGuard } from '../../../test/keycloak-auth.guard.testing';
import { Template, TemplateDbProps } from '../../templates/domain/template';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import { Item } from '../../items/domain/item';
import { ItemsService } from '../../items/infrastructure/items.service';
import {
  phoneFactory,
  phoneItemFactory,
  phoneModelFactory,
} from '../fixtures/product-passport.factory';
import { ProductPassport } from '../domain/product-passport';
import { ProductPassportModule } from '../product-passport.module';
import { productPassportToDto } from './dto/product-passport.dto';
import { IS_PUBLIC } from '../../auth/decorators/public.decorator';

describe('ProductPassportController', () => {
  let app: INestApplication;
  let modelsService: ModelsService;
  let itemsService: ItemsService;

  let templateService: TemplateService;
  const reflector: Reflector = new Reflector();
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(
    new Map(),
    reflector,
  );
  const userId = randomUUID();
  const organizationId = randomUUID();
  let module: TestingModule;

  beforeEach(() => {
    jest.spyOn(reflector, 'get').mockReturnValue(false);
  });

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule, ProductPassportModule],
      providers: [
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
      ],
    }).compile();

    modelsService = module.get(ModelsService);
    itemsService = module.get(ItemsService);
    templateService = module.get<TemplateService>(TemplateService);

    app = module.createNestApplication();

    await app.init();
  });
  const authProps = { userId, organizationId };
  const phoneTemplate: TemplateDbProps = phoneFactory
    .addSections()
    .build(authProps);

  it(`/GET public view for unique product identifier`, async () => {
    const template = Template.loadFromDb({ ...phoneTemplate });
    await templateService.save(template);

    const model = Model.loadFromDb(
      phoneModelFactory
        .addDataValues()
        .build({ ...authProps, templateId: template.id }),
    );

    const item = Item.loadFromDb(
      phoneItemFactory
        .addDataValues()
        .build({ ...authProps, modelId: model.id, templateId: template.id }),
    );
    model.createUniqueProductIdentifier();
    const uuid = item.uniqueProductIdentifiers[0].uuid;
    await itemsService.save(item);
    await modelsService.save(model);
    jest.spyOn(reflector, 'get').mockImplementation((key) => key === IS_PUBLIC);

    const response = await request(app.getHttpServer()).get(
      `/product-passports/${uuid}`,
    );
    expect(response.status).toEqual(200);

    const productPassport = ProductPassport.create({
      uniqueProductIdentifier: item.uniqueProductIdentifiers[0],
      template: template,
      model: model,
      item: item,
    });
    expect(response.body).toEqual(productPassportToDto(productPassport));
  });

  afterAll(async () => {
    await module.close();
    await app.close();
  });
});
