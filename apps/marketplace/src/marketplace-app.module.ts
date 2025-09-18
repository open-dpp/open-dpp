import { Module } from '@nestjs/common';
import { PassportTemplateModule } from './passport-templates/passport-template.module';

@Module({
  imports: [PassportTemplateModule],
  controllers: [],
  providers: [],
})
export class MarketplaceAppModule {}
