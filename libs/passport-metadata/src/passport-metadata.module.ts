import { Module } from '@nestjs/common';
import { PassportMetadataService } from './passport-metadata.service';

@Module({
  providers: [PassportMetadataService],
  exports: [PassportMetadataService],
})
export class PassportMetadataModule {}
