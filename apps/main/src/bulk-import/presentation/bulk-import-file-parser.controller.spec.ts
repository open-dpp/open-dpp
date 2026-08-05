import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { expect, describe, it, beforeEach, jest } from "@jest/globals";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { BulkImportFileParserService } from "../infrastructure/bulk-import-file-parser.service";
import { BulkImportFileParserController } from "./bulk-import-file-parser.controller";
import { ORGANIZATION_ID_HEADER } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { UsersService } from "../../identity/users/application/services/users.service";
import type { Auth } from "better-auth";
import { AUTH } from "../../identity/auth/auth.provider";
import { UsersModule } from "../../identity/users/users.module";
import { EnvModule, EnvService } from "@open-dpp/env";
import { MongooseModule } from "@nestjs/mongoose";
import { generateMongoConfig } from "../../database/config";

describe("BulkImportFileParserController", () => {
  let app: INestApplication;
  let module: TestingModule;
  let mockService: jest.Mocked<BulkImportFileParserService>;
  const betterAuthHelper = new BetterAuthHelper();

  beforeEach(async () => {
    mockService = {
      parseFile: jest.fn(),
    } as unknown as jest.Mocked<BulkImportFileParserService>;

    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        UsersModule,
      ],
      controllers: [BulkImportFileParserController],
      providers: [
        {
          provide: BulkImportFileParserService,
          useValue: mockService,
        },
      ],
    }).compile();

    const userService = module.get<UsersService>(UsersService);
    betterAuthHelper.init(userService, module.get<Auth>(AUTH));

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe("POST /bulk-import/parse-file", () => {
    it("returns 400 for missing file", async () => {
      await request(app.getHttpServer()).post("/bulk-import/parse-file").expect(400);
    });

    it("returns 400 for files larger than 10MB", async () => {
      const { userCookie, org } = await betterAuthHelper.createOrganizationAndUserWithCookie();

      const largeFileContent = "x".repeat(10 * 1024 * 1024 + 1);
      const response = await request(app.getHttpServer())
        .post("/bulk-import/parse-file")
        .set(ORGANIZATION_ID_HEADER, org.id)
        .set("Cookie", userCookie)
        .attach("file", Buffer.from(largeFileContent), "large.csv");
      expect(response.status).toBe(400);
    });

    it("returns 400 for unsupported file type", async () => {
      await request(app.getHttpServer())
        .post("/bulk-import/parse-file")
        .attach("file", Buffer.from("test"), "test.txt")
        .expect(400);
    });

    it("calls service.parseFile with correct parameters", async () => {
      const { userCookie, org } = await betterAuthHelper.createOrganizationAndUserWithCookie();
      const csvContent = "name,age\nJohn,30";
      const mockBuffer = Buffer.from(csvContent, "utf8");

      mockService.parseFile.mockReturnValue({ rows: [{ name: "John", age: "30" }] });

      const response = await request(app.getHttpServer())
        .post("/bulk-import/parse-file")
        .set(ORGANIZATION_ID_HEADER, org.id)
        .set("Cookie", userCookie)
        .attach("file", mockBuffer, "test.csv");
      expect(response.status).toBe(201);

      expect(mockService.parseFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        "test.csv",
        expect.any(String),
      );
    });

    it("returns parsed rows from service", async () => {
      const { userCookie, org } = await betterAuthHelper.createOrganizationAndUserWithCookie();

      const csvContent = "name,age\nJohn,30\nJane,25";
      const mockBuffer = Buffer.from(csvContent, "utf8");
      const expectedRows = [
        { name: "John", age: "30" },
        { name: "Jane", age: "25" },
      ];

      mockService.parseFile.mockReturnValue({ rows: expectedRows });

      const response = await request(app.getHttpServer())
        .post("/bulk-import/parse-file")
        .set(ORGANIZATION_ID_HEADER, org.id)
        .set("Cookie", userCookie)
        .attach("file", mockBuffer, "test.csv")
        .expect(201);

      expect(response.body.rows).toEqual(expectedRows);
    });

    it("handles service errors", async () => {
      const csvContent = "name,age";
      const mockBuffer = Buffer.from(csvContent, "utf8");

      mockService.parseFile.mockImplementation(() => {
        throw new Error("File must contain at least 1 data row");
      });

      await request(app.getHttpServer())
        .post("/bulk-import/parse-file")
        .attach("file", mockBuffer, "test.csv")
        .expect(400);
    });
  });
});
