import type { TestingModule } from "@nestjs/testing";
import { expect } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import { MongooseTestingModule } from "@open-dpp/testing";
import { MediaDbSchema, MediaDoc } from "../infrastructure/media.schema";
import { MediaService } from "../infrastructure/media.service";
import { MediaController } from "./media.controller";

describe("mediaController", () => {
  let controller: MediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: MediaDoc.name,
            schema: MediaDbSchema,
          },
        ]),
      ],
      providers: [MediaService],
      controllers: [MediaController],
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
