import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, type TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import type { Connection } from "mongoose";

import { generateMongoConfig } from "../database/config";
import { Permalink } from "../permalink/domain/permalink";
import { PermalinkRepository } from "../permalink/infrastructure/permalink.repository";
import { PermalinkDoc, PermalinkSchema } from "../permalink/infrastructure/permalink.schema";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../presentation-configurations/infrastructure/presentation-configuration.schema";
import { findOne, findOneOrFail } from "./repositories";

describe("repositories generic helpers — NoSQL injection hardening", () => {
  let repository: PermalinkRepository;
  let permalinkModel: any;
  let connection: Connection;
  let module: TestingModule;

  beforeAll(async () => {
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
        MongooseModule.forFeature([
          { name: PermalinkDoc.name, schema: PermalinkSchema },
          {
            name: PresentationConfigurationDoc.name,
            schema: PresentationConfigurationSchema,
          },
        ]),
      ],
      providers: [PermalinkRepository],
    }).compile();

    repository = module.get(PermalinkRepository);
    connection = module.get<Connection>(getConnectionToken());
    permalinkModel = connection.model(PermalinkDoc.name);
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(async () => {
    await connection.collection("permalinkdocs").deleteMany({});
  });

  const fromPlain = async (plain: any) => Permalink.fromPlain(plain);

  it("findOne returns the matching doc for a valid string _id", async () => {
    const permalink = Permalink.create({ presentationConfigurationId: randomUUID() });
    await repository.save(permalink);

    const found = await findOne(permalink.id, permalinkModel, fromPlain);

    expect(found).toBeDefined();
    expect(found?.id).toBe(permalink.id);
  });

  it("findOne returns undefined for a missing valid string _id", async () => {
    const found = await findOne(randomUUID(), permalinkModel, fromPlain);
    expect(found).toBeUndefined();
  });

  it.each([
    [{ $gt: "" }, "$gt empty"],
    [{ $ne: null }, "$ne null"],
    [{ $regex: ".*" }, "$regex .*"],
    [{ $in: ["x", "y"] }, "$in array"],
  ])("findOne refuses to match documents for an operator object (%s)", async (payload) => {
    await repository.save(Permalink.create({ presentationConfigurationId: randomUUID() }));
    await repository.save(Permalink.create({ presentationConfigurationId: randomUUID() }));

    await expect(
      findOne(payload as unknown as string, permalinkModel, fromPlain),
    ).rejects.toThrow();
  });

  it("findOneOrFail refuses to leak documents for an operator object", async () => {
    await repository.save(Permalink.create({ presentationConfigurationId: randomUUID() }));

    await expect(
      findOneOrFail({ $gt: "" } as unknown as string, permalinkModel, fromPlain),
    ).rejects.toThrow();
  });

  it("findOneOrFail throws NotFoundInDatabaseException for a missing valid string _id", async () => {
    await expect(findOneOrFail(randomUUID(), permalinkModel, fromPlain)).rejects.toBeInstanceOf(
      NotFoundInDatabaseException,
    );
  });
});
