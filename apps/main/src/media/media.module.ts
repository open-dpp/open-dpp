import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { MediaDbSchema, MediaDoc } from './infrastructure/media.schema'
import { MediaService } from './infrastructure/media.service'
import { MediaController } from './presentation/media.controller'

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
