import { Test, TestingModule } from '@nestjs/testing';
import { PassportTemplateService } from './passport-template.service';
import { Connection } from 'mongoose';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import {
  PassportTemplateDoc,
  PassportTemplateDbSchema,
} from './passport-template.schema';
import { PassportTemplate } from '../domain/passport-template';
import { passportTemplatePropsFactory } from '../fixtures/passport-template-props.factory';
import { randomUUID } from 'crypto';
import { expect } from '@jest/globals';
import { NotFoundInDatabaseException } from '@app/exception/service.exceptions';

describe('PassportTemplateService', () => {
  let service: PassportTemplateService;
  let mongoConnection: Connection;
  let module: TestingModule;

  const mockNow = new Date('2025-01-01T12:00:00Z').getTime();

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => mockNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: PassportTemplateDoc.name,
            schema: PassportTemplateDbSchema,
          },
        ]),
      ],
      providers: [PassportTemplateService],
    }).compile();
    service = module.get<PassportTemplateService>(PassportTemplateService);
    mongoConnection = module.get<Connection>(getConnectionToken());
  });

  it('fails if requested passport template could not be found', async () => {
    await expect(service.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(PassportTemplate.name),
    );
  });

  it('should create passport template', async () => {
    const passportTemplate = PassportTemplate.loadFromDb(
      passportTemplatePropsFactory.build(),
    );

    const { id } = await service.save(passportTemplate);
    const found = await service.findOneOrFail(id);
    expect(found).toEqual(passportTemplate);
  });

  it('should find all passport templates', async () => {
    const passportTemplate = PassportTemplate.loadFromDb(
      passportTemplatePropsFactory.build(),
    );
    const passportTemplate2 = PassportTemplate.loadFromDb(
      passportTemplatePropsFactory.build({ id: randomUUID() }),
    );

    await service.save(passportTemplate);
    await service.save(passportTemplate2);
    const found = await service.findAll();
    expect(found).toContainEqual(passportTemplate);
    expect(found).toContainEqual(passportTemplate2);
  });

  afterAll(async () => {
    await mongoConnection.close();
    await module.close();
  });
});
