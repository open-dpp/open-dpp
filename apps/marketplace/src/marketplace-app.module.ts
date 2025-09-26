import { Module } from '@nestjs/common';
import { PassportTemplateModule } from './passport-templates/passport-template.module';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [DatabaseModule, PassportTemplateModule],
  controllers: [],
  providers: [],
})
export class MarketplaceAppModule {}
