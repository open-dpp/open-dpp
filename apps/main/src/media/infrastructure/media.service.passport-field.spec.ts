import type { TestingModule } from "@nestjs/testing";
import type { Model } from "mongoose";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { MediaDbSchema, MediaDoc } from "./media.schema";
import { MediaService } from "./media.service";

// S3 is replaced by an in-memory object store; file processing and MongoDB are real.
const { objectStore, uploadGate } = vi.hoisted(() => ({
  objectStore: new Map<string, Buffer>(),
  // When set, every upload to the bucket waits on it before it stores the object.
  uploadGate: { wait: undefined as (() => Promise<void>) | undefined },
}));

vi.mock("minio", () => ({
  // `new Client(...)` needs a constructible implementation, not an arrow function.
  Client: vi.fn(function () {
    return {
      bucketExists: async () => true,
      putObject: async (bucket: string, objectName: string, buffer: Buffer) => {
        await uploadGate.wait?.();
        objectStore.set(`${bucket}/${objectName}`, Buffer.from(buffer));
        return { etag: "etag", versionId: null };
      },
      removeObject: async (bucket: string, objectName: string) => {
        objectStore.delete(`${bucket}/${objectName}`);
      },
    };
  }),
  S3Error: class S3Error extends Error {},
}));

const MINIMAL_PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

/** Lets callers through only once `parties` of them arrived. */
function barrier(parties: number): () => Promise<void> {
  let arrived = 0;
  let open: () => void = () => undefined;
  const opened = new Promise<void>((resolve) => {
    open = resolve;
  });
  return async () => {
    arrived += 1;
    if (arrived === parties) {
      open();
    }
    await opened;
  };
}

describe("MediaService with a passport field in MongoDB", () => {
  let module: TestingModule;
  let service: MediaService;
  let mediaModel: Model<MediaDoc>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([{ name: MediaDoc.name, schema: MediaDbSchema }]),
      ],
      providers: [MediaService],
    }).compile();

    service = module.get(MediaService);
    mediaModel = module.get(getModelToken(MediaDoc.name));
    // The unique index is built asynchronously; the race below needs it in place.
    await mediaModel.syncIndexes();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    objectStore.clear();
    uploadGate.wait = undefined;
  });

  const uploadToField = (uniqueProductIdentifier: string, uploadedByUserId: string) =>
    service.uploadFileOfProductPassport(
      "manual.pdf",
      MINIMAL_PDF,
      "manual",
      uniqueProductIdentifier,
      uploadedByUserId,
      "org-id",
    );

  it("keeps one media when two first uploads to a passport field run at the same time", async () => {
    const uniqueProductIdentifier = randomUUID();
    // Both uploads read the empty field before either one saves its media.
    uploadGate.wait = barrier(2);

    const [first, second] = await Promise.all([
      uploadToField(uniqueProductIdentifier, "user-a"),
      uploadToField(uniqueProductIdentifier, "user-b"),
    ]);

    expect(second.id).toBe(first.id);
    const stored = await mediaModel.find({ dataFieldId: "manual", uniqueProductIdentifier }).lean();
    expect(stored.map((media) => media._id)).toEqual([first.id]);
    // The object of the file that was replaced is gone; the media points to the other one.
    const objectsOfField = [...objectStore.keys()].filter((key) =>
      key.includes(`/${uniqueProductIdentifier}/`),
    );
    expect(objectsOfField).toEqual([`${stored[0].bucket}/${stored[0].objectName}`]);
  });

  it("replaces the file of the field's media on a later upload", async () => {
    const uniqueProductIdentifier = randomUUID();

    const first = await uploadToField(uniqueProductIdentifier, "user-a");
    const second = await uploadToField(uniqueProductIdentifier, "user-b");

    expect(second.id).toBe(first.id);
    expect(await mediaModel.countDocuments({ uniqueProductIdentifier })).toBe(1);
  });

  it("stores any number of media without a passport field", async () => {
    const organizationId = randomUUID();

    await service.uploadMedia("a.pdf", MINIMAL_PDF, "user-a", organizationId);
    await service.uploadMedia("b.pdf", MINIMAL_PDF, "user-a", organizationId);

    expect(await mediaModel.countDocuments({ ownedByOrganizationId: organizationId })).toBe(2);
  });
});
