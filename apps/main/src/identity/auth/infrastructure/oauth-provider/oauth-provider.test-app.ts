import { jest } from "@jest/globals";
import { INestApplication, VersioningType } from "@nestjs/common";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { AllApiVersions, LatestApiVersionWithPrefixDto } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import type { Connection } from "mongoose";
import { generateMongoConfig } from "../../../../database/config";
import { EmailService } from "../../../../email/email.service";
import { OrganizationsModule } from "../../../organizations/organizations.module";
import { UsersModule } from "../../../users/users.module";
import { AuthModule } from "../../auth.module";

/** The better-auth mount, as the production bootstrap exposes it. */
export const AUTH_PATH = `/api/${LatestApiVersionWithPrefixDto}/auth`;

/** Collections the OAuth Provider (and its jwt plugin) create lazily on first use. */
export const OAUTH_PROVIDER_COLLECTIONS = [
  "jwks",
  "oauthClient",
  "oauthAccessToken",
  "oauthRefreshToken",
  "oauthConsent",
];

export interface AuthTestApp {
  app: INestApplication;
  moduleRef: TestingModule;
  connection: Connection;
}

/** Boots the auth stack with the production prefix and versioning, on a fresh database. */
export async function bootAuthTestApp(): Promise<AuthTestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      EnvModule.forRoot(),
      MongooseModule.forRootAsync({
        imports: [EnvModule],
        useFactory: (configService: EnvService) => ({ ...generateMongoConfig(configService) }),
        inject: [EnvService],
      }),
      AuthModule,
      UsersModule,
      OrganizationsModule,
    ],
  })
    .overrideProvider(EmailService)
    .useValue({ send: jest.fn() })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: AllApiVersions });
  await app.init();

  return { app, moduleRef, connection: moduleRef.get<Connection>(getConnectionToken()) };
}

export async function collectionNames(connection: Connection): Promise<string[]> {
  const db = connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  return collections.map((collection) => collection.name);
}
