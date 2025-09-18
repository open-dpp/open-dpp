import { Module } from '@nestjs/common';
import { MediaService } from './infrastructure/media.service';
import { MediaController } from './presentation/media.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaDbSchema, MediaDoc } from './infrastructure/media.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MediaDoc.name,
        schema: MediaDbSchema,
      },
    ]),
    HttpModule,
  ],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
