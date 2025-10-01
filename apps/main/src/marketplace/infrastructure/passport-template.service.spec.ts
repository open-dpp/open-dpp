import { Test, TestingModule } from '@nestjs/testing';
import { PassportTemplatePublicationService } from './passport-template-publication.service';
import { Connection } from 'mongoose';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import {
  PassportTemplatePublicationDbSchema,
  PassportTemplatePublicationDoc,
} from './passport-template-publication.schema';
import { PassportTemplatePublication } from '../domain/passport-template-publication';
import { passportTemplatePublicationPropsFactory } from '../fixtures/passport-template-publication-props.factory';
import { randomUUID } from 'crypto';
import { expect } from '@jest/globals';
import { NotFoundInDatabaseException } from '@app/exception/service.exceptions';
import { MongooseTestingModule } from '@app/testing/mongo.testing.module';

describe('PassportTemplateService', () => {
  let service: PassportTemplatePublicationService;
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
            name: PassportTemplatePublicationDoc.name,
            schema: PassportTemplatePublicationDbSchema,
          },
        ]),
      ],
      providers: [PassportTemplatePublicationService],
    }).compile();
    service = module.get<PassportTemplatePublicationService>(
      PassportTemplatePublicationService,
    );
    mongoConnection = module.get<Connection>(getConnectionToken());
  });

  it('fails if requested passport template could not be found', async () => {
    await expect(service.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(PassportTemplatePublication.name),
    );
  });

  it('should create passport template', async () => {
    const passportTemplate = PassportTemplatePublication.loadFromDb(
      passportTemplatePublicationPropsFactory.build(),
    );

    const { id } = await service.save(passportTemplate);
    const found = await service.findOneOrFail(id);
    expect(found).toEqual(passportTemplate);
  });

  it('should find all passport templates', async () => {
    const passportTemplate = PassportTemplatePublication.loadFromDb(
      passportTemplatePublicationPropsFactory.build(),
    );
    const passportTemplate2 = PassportTemplatePublication.loadFromDb(
      passportTemplatePublicationPropsFactory.build({ id: randomUUID() }),
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
