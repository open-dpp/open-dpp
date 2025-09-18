import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { KeycloakSyncOnStartupModule } from './keycloak-sync-on-startup.module';
import { KeycloakSyncOnStartupService } from './keycloak-sync-on-startup/keycloak-sync-on-startup.service';
import { DataSource } from 'typeorm';
import { TypeOrmTestingModule } from '@app/testing/typeorm.testing.module';
import { expect } from '@jest/globals';

describe('KeycloakSyncOnStartupModule', () => {
  let module: TestingModule;
  let dataSource: DataSource;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmTestingModule,
        KeycloakSyncOnStartupModule,
      ],
    }).compile();
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide KeycloakSyncOnStartupService', () => {
    const service = module.get<KeycloakSyncOnStartupService>(
      KeycloakSyncOnStartupService,
    );
    expect(service).toBeDefined();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });
});
