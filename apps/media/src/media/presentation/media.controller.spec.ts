import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from '../infrastructure/media.service';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaDbSchema, MediaDoc } from '../infrastructure/media.schema';
import { ConfigModule } from '@nestjs/config';

describe('MediaController', () => {
  let controller: MediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
