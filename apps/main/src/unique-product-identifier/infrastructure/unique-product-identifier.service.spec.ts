import type { TestingModule } from "@nestjs/testing";
import type { Connection } from "mongoose";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { MongooseTestingModule, TypeOrmTestingModule } from "@open-dpp/testing";
import { v4 as uuid4 } from "uuid";
import { TraceabilityEventsModule } from "../../traceability-events/traceability-events.module";
import { UniqueProductIdentifier } from "../domain/unique.product.identifier";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "./unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "./unique-product-identifier.service";

describe("uniqueProductIdentifierService", () => {
  let service: UniqueProductIdentifierService;
  let mongoConnection: Connection;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmTestingModule,
        MongooseTestingModule,
        TraceabilityEventsModule,
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: UniqueProductIdentifierDoc.name,
            schema: UniqueProductIdentifierSchema,
          },
        ]),
      ],
      providers: [UniqueProductIdentifierService],
    }).compile();
    service = module.get<UniqueProductIdentifierService>(
      UniqueProductIdentifierService,
    );
    mongoConnection = module.get<Connection>(getConnectionToken());
  });

  it("should create unique product identifier with external id", async () => {
    const referenceId = uuid4();
    const externalUUID = uuid4();
    const uniqueProductIdentifier = UniqueProductIdentifier.create({
      referenceId,
      externalUUID,
    });
    const { uuid } = await service.save(uniqueProductIdentifier);
    const found = await service.findOneOrFail(uuid);
    expect(found.referenceId).toEqual(referenceId);
  });

  it("fails if requested unique product identifier model could not be found", async () => {
    await expect(service.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(UniqueProductIdentifier.name),
    );
  });

  it("should find all unique product identifiers with given referenced id", async () => {
    const referenceId = uuid4();
    const uniqueProductIdentifier1 = UniqueProductIdentifier.create({
      referenceId,
    });
    await service.save(uniqueProductIdentifier1);
    const uniqueProductIdentifier2 = UniqueProductIdentifier.create({
      referenceId,
    });
    await service.save(uniqueProductIdentifier2);
    const found = await service.findAllByReferencedId(referenceId);
    expect(found).toContainEqual(uniqueProductIdentifier1);
    expect(found).toContainEqual(uniqueProductIdentifier2);
  });

  afterAll(async () => {
    await mongoConnection.close();
  });
});
