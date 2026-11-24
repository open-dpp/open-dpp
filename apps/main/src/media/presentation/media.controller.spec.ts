import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import {
  ForbiddenExceptionFilter,
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from "@open-dpp/exception";
import { Auth } from "better-auth";
import sharp from "sharp";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AuthModule } from "../../identity/auth/auth.module";
import { AUTH } from "../../identity/auth/auth.provider";
import { AuthGuard } from "../../identity/auth/infrastructure/guards/auth.guard";
import { ORGANIZATION_ID_HEADER } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { OrganizationsModule } from "../../identity/organizations/organizations.module";
import { UsersService } from "../../identity/users/application/services/users.service";
import { UsersModule } from "../../identity/users/users.module";
import { Media } from "../domain/media";
import { MediaDbSchema, MediaDoc } from "../infrastructure/media.schema";
import { MediaService } from "../infrastructure/media.service";
import { MediaController } from "./media.controller";

// S3 is replaced by an in-memory object store; everything else (sharp, file-type, DOMPurify,
// MongoDB) is real.
const { objectStore } = vi.hoisted(() => ({ objectStore: new Map<string, Buffer>() }));

vi.mock("minio", async () => {
  const { Readable } = await import("node:stream");
  return {
    // `new Client(...)` needs a constructible implementation, not an arrow function.
    Client: vi.fn(function () {
      return {
        bucketExists: async () => true,
        putObject: async (bucket: string, objectName: string, buffer: Buffer) => {
          objectStore.set(`${bucket}/${objectName}`, Buffer.from(buffer));
          return { etag: "etag", versionId: null };
        },
        getObject: async (bucket: string, objectName: string) => {
          const stored = objectStore.get(`${bucket}/${objectName}`);
          if (!stored) {
            throw new Error(`No object ${bucket}/${objectName}`);
          }
          return Readable.from([stored]);
        },
        removeObject: async (bucket: string, objectName: string) => {
          objectStore.delete(`${bucket}/${objectName}`);
        },
      };
    }),
  };
});

const SVG_WITH_SCRIPT = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" onload="alert(1)"><script>alert(2)</script><rect width="10" height="10"/></svg>`,
);
const SVG_WITH_DOCTYPE = Buffer.from(
  `<!DOCTYPE svg [<!ENTITY a "a">]><svg xmlns="http://www.w3.org/2000/svg"><text>&a;</text></svg>`,
);
const MINIMAL_PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const HEIC_HEADER = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x18]),
  Buffer.from("ftypheic"),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from("mif1heic"),
]);

function rasterImage(format: "png" | "webp"): Promise<Buffer> {
  return sharp({ create: { width: 4, height: 4, channels: 3, background: "#3366ff" } })
    [format]()
    .toBuffer();
}

function binaryParser(
  res: request.Response,
  callback: (error: Error | null, body: Buffer) => void,
) {
  const chunks: Buffer[] = [];
  res.on("data", (chunk: Buffer) => chunks.push(chunk));
  res.on("end", () => callback(null, Buffer.concat(chunks)));
}

describe("MediaController", () => {
  let app: INestApplication;
  let module: TestingModule;
  let organizationId: string;
  let cookie: string;

  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        EventEmitterModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          {
            name: MediaDoc.name,
            schema: MediaDbSchema,
          },
        ]),
        AuthModule,
        OrganizationsModule,
        UsersModule,
      ],
      providers: [
        MediaService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [MediaController],
    })
      .overrideProvider(EmailService)
      .useValue({
        send: vi.fn(),
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalFilters(
      new NotFoundInDatabaseExceptionFilter(),
      new NotFoundExceptionFilter(),
      new ValueErrorFilter(),
      new ForbiddenExceptionFilter(),
    );
    betterAuthHelper.init(module.get<UsersService>(UsersService), module.get<Auth>(AUTH));
    await app.init();

    const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    organizationId = org.id;
    cookie = userCookie;
  });

  afterAll(async () => {
    await app.close();
    await module.close();
  });

  function upload(path: string, file: Buffer, filename: string, contentType: string) {
    return request(app.getHttpServer())
      .post(path)
      .set("Cookie", cookie)
      .set(ORGANIZATION_ID_HEADER, organizationId)
      .attach("file", file, { filename, contentType });
  }

  function download(path: string) {
    return request(app.getHttpServer()).get(path).buffer(true).parse(binaryParser);
  }

  /** Stores the record of a file created at the given time, without a file in the object store. */
  async function storeMedia(ownedByOrganizationId: string, title: string, createdAt: string) {
    const id = randomUUID();
    await module.get(MediaService).save(
      Media.loadFromDb({
        id,
        ownedByOrganizationId,
        createdByUserId: "user-id",
        title,
        description: title,
        mimeType: "image/png",
        fileExtension: "png",
        size: 7,
        originalFilename: title,
        uniqueProductIdentifier: null,
        dataFieldId: null,
        bucket: "bucket",
        objectName: `product-passport-files/${id}`,
        eTag: "etag",
        versionId: "unversioned",
        createdAt: new Date(createdAt),
        updatedAt: new Date(createdAt),
      }),
    );
    return id;
  }

  describe("GET /media/by-organization", () => {
    async function signInToNewOrganization() {
      const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
      return {
        organizationId: org.id,
        list: (query: { limit?: number; cursor?: string } = {}) =>
          request(app.getHttpServer())
            .get("/media/by-organization")
            .query(query)
            .set("Cookie", userCookie)
            .set(ORGANIZATION_ID_HEADER, org.id),
      };
    }

    it("answers one page of the organization's files, newest first, with their total", async () => {
      const { organizationId, list } = await signInToNewOrganization();
      await storeMedia(organizationId, "oldest.png", "2026-01-01T00:00:00.000Z");
      const newestId = await storeMedia(organizationId, "newest.png", "2026-01-03T00:00:00.000Z");
      await storeMedia(organizationId, "middle.png", "2026-01-02T00:00:00.000Z");

      const response = await list({ limit: 2 }).expect(200);

      expect(response.body.result.map((media: { title: string }) => media.title)).toEqual([
        "newest.png",
        "middle.png",
      ]);
      expect(response.body.result[0]).toMatchObject({
        id: newestId,
        mimeType: "image/png",
        size: 7,
        createdAt: "2026-01-03T00:00:00.000Z",
      });
      expect(response.body.paging_metadata).toEqual({
        cursor: expect.any(String),
        total_count: 3,
      });
    });

    it("continues after the cursor until every file was listed once", async () => {
      const { organizationId, list } = await signInToNewOrganization();
      await storeMedia(organizationId, "first.png", "2026-01-01T00:00:00.000Z");
      // Two files of the same instant: the cursor has to tell them apart by their id
      await storeMedia(organizationId, "twin-a.png", "2026-01-02T00:00:00.000Z");
      await storeMedia(organizationId, "twin-b.png", "2026-01-02T00:00:00.000Z");
      await storeMedia(organizationId, "fourth.png", "2026-01-03T00:00:00.000Z");
      await storeMedia(organizationId, "fifth.png", "2026-01-04T00:00:00.000Z");

      const pages: string[][] = [];
      let cursor: string | undefined;
      do {
        const response = await list({ limit: 2, cursor }).expect(200);
        pages.push(response.body.result.map((media: { title: string }) => media.title));
        cursor = response.body.paging_metadata.cursor ?? undefined;
      } while (cursor && pages.length < 5);

      expect(pages.map((titles) => titles.toSorted())).toEqual([
        ["fifth.png", "fourth.png"],
        ["twin-a.png", "twin-b.png"],
        ["first.png"],
      ]);
    });

    it("lists and counts only the files of the organization in the header", async () => {
      const { organizationId, list } = await signInToNewOrganization();
      const other = await signInToNewOrganization();
      await storeMedia(organizationId, "ours.png", "2026-01-01T00:00:00.000Z");
      await storeMedia(other.organizationId, "theirs.png", "2026-01-02T00:00:00.000Z");

      const response = await list().expect(200);

      expect(response.body.result.map((media: { title: string }) => media.title)).toEqual([
        "ours.png",
      ]);
      expect(response.body.paging_metadata).toEqual({ cursor: null, total_count: 1 });
    });

    it.each([-1, 0, 1.5, 101])("rejects a limit of %s", async (limit) => {
      const { organizationId, list } = await signInToNewOrganization();
      await storeMedia(organizationId, "file.png", "2026-01-01T00:00:00.000Z");

      await list({ limit }).expect(400);
    });

    it("answers 100 files when no limit is given", async () => {
      const { organizationId, list } = await signInToNewOrganization();
      const start = Date.parse("2026-01-01T00:00:00.000Z");
      await Promise.all(
        Array.from({ length: 101 }, (_, index) =>
          storeMedia(organizationId, `file-${index}.png`, new Date(start + index).toISOString()),
        ),
      );

      const response = await list().expect(200);

      expect(response.body.result).toHaveLength(100);
      expect(response.body.paging_metadata).toEqual({
        cursor: expect.any(String),
        total_count: 101,
      });
    });
  });

  describe("POST /media/upload", () => {
    it("stores a sanitized SVG and serves it with a sandboxing CSP", async () => {
      const uploaded = await upload(
        "/media/upload",
        SVG_WITH_SCRIPT,
        "logo.svg",
        "image/svg+xml",
      ).expect(201);

      const response = await download(`/media/${uploaded.body.mediaId}/download`).expect(200);

      expect(response.headers["content-type"]).toBe("image/svg+xml");
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["content-security-policy"]).toBe(
        "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
      );
      const body = (response.body as Buffer).toString("utf8");
      expect(body).toContain("<rect");
      expect(body).not.toMatch(/script|onload|alert/);
    });

    it("converts a WebP upload and serves it without a CSP", async () => {
      const uploaded = await upload(
        "/media/upload",
        await rasterImage("webp"),
        "photo.webp",
        "image/webp",
      ).expect(201);

      const response = await download(`/media/${uploaded.body.mediaId}/download`).expect(200);

      expect(response.headers["content-type"]).toBe("image/webp");
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["content-security-policy"]).toBeUndefined();
      expect((await sharp(response.body as Buffer).metadata()).format).toBe("webp");
    });

    it("serves a PDF with nosniff and without a CSP", async () => {
      const uploaded = await upload(
        "/media/upload",
        MINIMAL_PDF,
        "manual.pdf",
        "application/pdf",
      ).expect(201);

      const response = await download(`/media/${uploaded.body.mediaId}/download`).expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["content-security-policy"]).toBeUndefined();
    });

    it("detects the type from the content, not from the file name or MIME type", async () => {
      const uploaded = await upload(
        "/media/upload",
        SVG_WITH_SCRIPT,
        "photo.png",
        "image/png",
      ).expect(201);

      const info = await request(app.getHttpServer())
        .get(`/media/${uploaded.body.mediaId}/info`)
        .expect(200);

      expect(info.body.mimeType).toBe("image/svg+xml");
      expect(info.body.fileExtension).toBe("svg");
    });

    it("rejects a text file named like an SVG", async () => {
      await upload(
        "/media/upload",
        Buffer.from("not an image"),
        "logo.svg",
        "image/svg+xml",
      ).expect(400);
    });

    it("rejects an SVG with a DOCTYPE declaration", async () => {
      await upload("/media/upload", SVG_WITH_DOCTYPE, "logo.svg", "image/svg+xml").expect(400);
    });

    it("rejects a HEIC image", async () => {
      await upload("/media/upload", HEIC_HEADER, "photo.heic", "image/heic").expect(400);
    });
  });

  describe("POST /media/organization-profile", () => {
    it("accepts an SVG logo", async () => {
      await upload(
        "/media/organization-profile",
        SVG_WITH_SCRIPT,
        "logo.svg",
        "image/svg+xml",
      ).expect(201);
    });

    it("rejects a PDF", async () => {
      await upload(
        "/media/organization-profile",
        MINIMAL_PDF,
        "logo.pdf",
        "application/pdf",
      ).expect(400);
    });
  });

  describe("POST /media/dpp/:upi/:dataFieldId", () => {
    it("serves a passport SVG with a sandboxing CSP", async () => {
      const upi = randomUUID();
      await upload(`/media/dpp/${upi}/logo`, SVG_WITH_SCRIPT, "logo.svg", "image/svg+xml").expect(
        201,
      );

      const response = await download(`/media/dpp/${upi}/logo/download`).expect(200);

      expect(response.headers["content-type"]).toBe("image/svg+xml");
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["content-security-policy"]).toContain("sandbox");
    });

    it("keeps the existing file when its replacement is rejected", async () => {
      const upi = randomUUID();
      await upload(
        `/media/dpp/${upi}/photo`,
        await rasterImage("png"),
        "photo.png",
        "image/png",
      ).expect(201);

      await upload(
        `/media/dpp/${upi}/photo`,
        Buffer.from("not an image"),
        "photo.png",
        "image/png",
      ).expect(400);

      const info = await request(app.getHttpServer())
        .get(`/media/dpp/${upi}/photo/info`)
        .expect(200);
      expect(info.body.mimeType).toBe("image/webp");
    });
  });
});
