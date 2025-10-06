import { Module } from '@nestjs/common';
import { MediaService } from './infrastructure/media.service';
import { MediaController } from './presentation/media.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaDbSchema, MediaDoc } from './infrastructure/media.schema';
import { HttpModule } from '@nestjs/axios';
import { EnvModule } from '@app/env/env.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MediaDoc.name,
        schema: MediaDbSchema,
      },
    ]),
    HttpModule,
    EnvModule,
  ],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
