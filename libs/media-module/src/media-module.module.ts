import { Module } from '@nestjs/common';
import { MediaModuleService } from './media-module.service';

@Module({
  providers: [MediaModuleService],
  exports: [MediaModuleService],
})
export class MediaModuleModule {}
