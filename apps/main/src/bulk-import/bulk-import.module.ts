import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DatabaseModule } from "../database/database.module";
import { PassportsModule } from "../passports/passports.module";
import { TemplatesModule } from "../templates/templates.module";
import { BulkImportConfigService } from "./application/services/bulk-import-config.service";
import { BulkImportRunService } from "./application/services/bulk-import-run.service";
import { BulkImportConfigDoc, BulkImportConfigSchema } from "./infrastructure/bulk-import-config.schema";
import { BulkImportConfigRepository } from "./infrastructure/bulk-import-config.repository";
import {
  BulkImportProductLinkDoc,
  BulkImportProductLinkSchema,
} from "./infrastructure/bulk-import-product-link.schema";
import { BulkImportProductLinkRepository } from "./infrastructure/bulk-import-product-link.repository";
import { BulkImportRunItemDoc, BulkImportRunItemSchema } from "./infrastructure/bulk-import-run-item.schema";
import { BulkImportRunItemRepository } from "./infrastructure/bulk-import-run-item.repository";
import { BulkImportRunDoc, BulkImportRunSchema } from "./infrastructure/bulk-import-run.schema";
import { BulkImportRunRepository } from "./infrastructure/bulk-import-run.repository";
import { BulkImportConfigController } from "./presentation/bulk-import-config.controller";
import { BulkImportRunController } from "./presentation/bulk-import-run.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BulkImportConfigDoc.name, schema: BulkImportConfigSchema },
      { name: BulkImportRunDoc.name, schema: BulkImportRunSchema },
      { name: BulkImportRunItemDoc.name, schema: BulkImportRunItemSchema },
      { name: BulkImportProductLinkDoc.name, schema: BulkImportProductLinkSchema },
    ]),
    DatabaseModule,
    forwardRef(() => PassportsModule),
    forwardRef(() => TemplatesModule),
  ],
  controllers: [BulkImportConfigController, BulkImportRunController],
  providers: [
    BulkImportConfigRepository,
    BulkImportRunRepository,
    BulkImportRunItemRepository,
    BulkImportProductLinkRepository,
    BulkImportConfigService,
    BulkImportRunService,
  ],
  exports: [BulkImportConfigService],
})
export class BulkImportModule {}
