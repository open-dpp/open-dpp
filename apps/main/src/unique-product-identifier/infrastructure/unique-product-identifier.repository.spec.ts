import type { TestingModule } from "@nestjs/testing";
import type { Model } from "mongoose";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { v4 as uuid4 } from "uuid";
import { generateMongoConfig } from "../../database/config";
import { TraceabilityEventsModule } from "../../traceability-events/traceability-events.module";
import { UniqueProductIdentifier } from "../domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "./unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "./unique-product-identifier.schema";

describe("uniqueProductIdentifierRepository", () => {
  let uniqueProductIdentifierRepository: UniqueProductIdentifierRepository;
  let uniqueProductIdentifierDoc: Model<UniqueProductIdentifierDoc>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        TraceabilityEventsModule,
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          {
            name: UniqueProductIdentifierDoc.name,
            schema: UniqueProductIdentifierSchema,
          },
        ]),
      ],
      providers: [UniqueProductIdentifierRepository],
    }).compile();
    uniqueProductIdentifierRepository = module.get<UniqueProductIdentifierRepository>(
      UniqueProductIdentifierRepository,
    );
    uniqueProductIdentifierDoc = module.get<Model<UniqueProductIdentifierDoc>>(
      getModelToken(UniqueProductIdentifierDoc.name),
    );
  });

  it("should create unique product identifier with external id", async () => {
    const referenceId = uuid4();
    const externalUUID = uuid4();
    const uniqueProductIdentifier = UniqueProductIdentifier.create({
      referenceId,
      externalUUID,
    });
    const { uuid } = await uniqueProductIdentifierRepository.save(uniqueProductIdentifier);
    const found = await uniqueProductIdentifierRepository.findOneOrFail(uuid);
    expect(found.referenceId).toEqual(referenceId);
  });

  it("fails if requested unique product identifier model could not be found", async () => {
    await expect(uniqueProductIdentifierRepository.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(UniqueProductIdentifier.name),
    );
  });

  it("should find all unique product identifiers with given referenced id", async () => {
    const referenceId = uuid4();
    const uniqueProductIdentifier1 = UniqueProductIdentifier.create({
      referenceId,
    });
    await uniqueProductIdentifierRepository.save(uniqueProductIdentifier1);
    const uniqueProductIdentifier2 = UniqueProductIdentifier.create({
      referenceId,
    });
    await uniqueProductIdentifierRepository.save(uniqueProductIdentifier2);
    const found = await uniqueProductIdentifierRepository.findAllByReferencedId(referenceId);
    expect(found).toContainEqual(uniqueProductIdentifier1);
    expect(found).toContainEqual(uniqueProductIdentifier2);
  });

  it("findOneByReferencedId returns newest UPI when multiple share referenceId", async () => {
    const referenceId = uuid4();
    const upi1 = UniqueProductIdentifier.create({ referenceId });
    await uniqueProductIdentifierRepository.save(upi1);
    await uniqueProductIdentifierDoc.updateOne(
      { _id: upi1.uuid },
      { $set: { createdAt: new Date(0) } },
    );
    const upi2 = UniqueProductIdentifier.create({ referenceId });
    await uniqueProductIdentifierRepository.save(upi2);
    const found = await uniqueProductIdentifierRepository.findOneByReferencedId(referenceId);
    expect(found).toBeDefined();
    expect(found!.uuid).toBe(upi2.uuid);
    const foundAgain = await uniqueProductIdentifierRepository.findOneByReferencedId(referenceId);
    expect(foundAgain!.uuid).toBe(found!.uuid);
  });

  it("delete upi by reference id", async () => {
    const referenceId = uuid4();
    const upi1 = UniqueProductIdentifier.create({ referenceId });
    await uniqueProductIdentifierRepository.save(upi1);
    await uniqueProductIdentifierRepository.deleteByReferenceId(referenceId);
    expect(await uniqueProductIdentifierRepository.findOneByReferencedId(referenceId)).toBeUndefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
