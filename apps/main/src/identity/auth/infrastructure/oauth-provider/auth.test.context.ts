import { jest } from "@jest/globals";
import { INestApplication, ModuleMetadata, VersioningType } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { AllApiVersions, LatestApiVersionWithPrefixDto } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import {
  ForbiddenExceptionFilter,
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from "@open-dpp/exception";
import type { Auth } from "better-auth";
import type { Connection } from "mongoose";
import { BetterAuthHelper } from "../../../../../test/better-auth-helper";
import { generateMongoConfig } from "../../../../database/config";
import { EmailService } from "../../../../email/email.service";
import { OrganizationsModule } from "../../../organizations/organizations.module";
import { UsersService } from "../../../users/application/services/users.service";
import { UsersModule } from "../../../users/users.module";
import { AuthModule } from "../../auth.module";
import { AUTH } from "../../auth.provider";
import { AuthGuard } from "../guards/auth.guard";

/** The API prefix of the latest version, as the production bootstrap exposes every route. */
export const API_PATH = `/api/${LatestApiVersionWithPrefixDto}`;

/** Collections the OAuth Provider (and its jwt plugin) create lazily on first use. */
export const OAUTH_PROVIDER_COLLECTIONS = [
  "jwks",
  "oauthClient",
  "oauthAccessToken",
  "oauthRefreshToken",
  "oauthConsent",
];

export interface AuthTestContext {
  app: INestApplication;
  moduleRef: TestingModule;
  connection: Connection;
  /** Ready to create users, organizations, cookies and api keys on this app. */
  betterAuthHelper: BetterAuthHelper;
}

export interface AuthTestContextOptions {
  /** Reuse a database across boots (the default is a fresh one per boot). */
  dbName?: string;
  /** Feature modules to mount next to the auth stack, e.g. `PolicyModule`. */
  imports?: ModuleMetadata["imports"];
  /** Register the AuthGuard globally, as the production bootstrap does. */
  withAuthGuard?: boolean;
}

/** Boots the auth stack with the production prefix, versioning and error filters, on a fresh database. */
export async function createAuthTestContext(
  options: AuthTestContextOptions = {},
): Promise<AuthTestContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      EnvModule.forRoot(),
      MongooseModule.forRootAsync({
        imports: [EnvModule],
        useFactory: (configService: EnvService) => ({
          ...generateMongoConfig(configService),
          ...(options.dbName ? { dbName: options.dbName } : {}),
        }),
        inject: [EnvService],
      }),
      AuthModule,
      UsersModule,
      OrganizationsModule,
      ...(options.imports ?? []),
    ],
    providers: options.withAuthGuard ? [{ provide: APP_GUARD, useClass: AuthGuard }] : [],
  })
    .overrideProvider(EmailService)
    .useValue({ send: jest.fn() })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api");
  // the domain-error filters of the production bootstrap (main.ts)
  app.useGlobalFilters(
    new NotFoundInDatabaseExceptionFilter(),
    new NotFoundExceptionFilter(),
    new ValueErrorFilter(),
    new ForbiddenExceptionFilter(),
  );
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: AllApiVersions });
  await app.init();

  const betterAuthHelper = new BetterAuthHelper();
  betterAuthHelper.init(moduleRef.get<UsersService>(UsersService), moduleRef.get<Auth>(AUTH));

  return {
    app,
    moduleRef,
    connection: moduleRef.get<Connection>(getConnectionToken()),
    betterAuthHelper,
  };
}

export async function collectionNames(connection: Connection): Promise<string[]> {
  const db = connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  return collections.map((collection) => collection.name);
}
