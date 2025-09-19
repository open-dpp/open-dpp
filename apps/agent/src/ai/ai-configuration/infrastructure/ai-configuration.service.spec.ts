import { Test, TestingModule } from '@nestjs/testing';
import { AiConfigurationService } from './ai-configuration.service';
import { Connection } from 'mongoose';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { NotFoundInDatabaseException } from '../../exceptions/service.exceptions';
import {
  AiConfigurationDbSchema,
  AiConfigurationDoc,
} from './ai-configuration.schema';
import { AiConfiguration } from '../domain/ai-configuration';
import { aiConfigurationFactory } from '../fixtures/ai-configuration-props.factory';

describe('AiConfigurationService', () => {
  let service: AiConfigurationService;
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
            name: AiConfigurationDoc.name,
            schema: AiConfigurationDbSchema,
          },
        ]),
      ],
      providers: [AiConfigurationService],
    }).compile();
    service = module.get<AiConfigurationService>(AiConfigurationService);
    mongoConnection = module.get<Connection>(getConnectionToken());
  });

  it('fails if requested configuration could not be found', async () => {
    await expect(service.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(AiConfiguration.name),
    );
  });

  it('should save configuration', async () => {
    const aiConfiguration = AiConfiguration.loadFromDb(
      aiConfigurationFactory.build(),
    );

    const { id } = await service.save(aiConfiguration);
    const found = await service.findOneOrFail(id);
    expect(found).toEqual(aiConfiguration);
  });

  it('should find configuration by organization id', async () => {
    const orgaId = randomUUID();
    const aiConfiguration = AiConfiguration.loadFromDb(
      aiConfigurationFactory.build({ ownedByOrganizationId: orgaId }),
    );
    await service.save(aiConfiguration);
    const found = await service.findOneByOrganizationId(orgaId);
    expect(found).toEqual(aiConfiguration);
  });

  afterAll(async () => {
    await mongoConnection.close();
    await module.close();
  });
});
