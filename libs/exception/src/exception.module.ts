import { Module } from '@nestjs/common';
import { ExceptionService } from './exception.service';

@Module({
  providers: [ExceptionService],
  exports: [ExceptionService],
})
export class ExceptionModule {}
