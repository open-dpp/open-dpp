import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { KeycloakSyncOnStartupModule } from './keycloak-sync-on-startup.module';
import { KeycloakSyncOnStartupService } from './keycloak-sync-on-startup/keycloak-sync-on-startup.service';
import { TypeOrmTestingModule } from '../../test/typeorm.testing.module';
import { DataSource } from 'typeorm';

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
