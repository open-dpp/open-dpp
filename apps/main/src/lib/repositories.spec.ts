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

// Black-box test of the generic `findOne`/`findOneOrFail` helpers in
// `repositories.ts`. The helpers used to call `Model.findById(id)`, which lets
// Mongoose forward a non-string `id` (e.g. an operator object produced by
// Express's `qs` query parser) as a MongoDB filter — the NoSQL-injection sink
// flagged by CodeQL alert #7. The current implementation uses
// `findOne({ _id: { $eq: id } })`, so non-string ids are compared as literal
// values and match nothing.
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

  // The mongoose model is private; bind a fromPlain that returns a plain
  // marker so the assertions can rely on `id` being preserved end-to-end.
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

  // Load-bearing: proves the CodeQL sink is closed. Casting through `unknown`
  // is intentional — Express/qs defeats the TypeScript contract at runtime,
  // so the helper must defend against object inputs even though the param is
  // typed `string`. Wrapping the lookup in `$eq` forces Mongoose to cast the
  // value as a literal against the String `_id` SchemaType — operator objects
  // fail to cast and the call rejects, so no document data is returned.
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

  // Sanity check: when no documents match a valid string id, findOneOrFail
  // surfaces the canonical NotFoundInDatabaseException (the same envelope
  // every other repository relies on).
  it("findOneOrFail throws NotFoundInDatabaseException for a missing valid string _id", async () => {
    await expect(findOneOrFail(randomUUID(), permalinkModel, fromPlain)).rejects.toBeInstanceOf(
      NotFoundInDatabaseException,
    );
  });
});
