import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule } from "@open-dpp/env";
import { MediaModule } from "../media/media.module";
import { ModelsModule } from "../models/models.module";
import { CapEvaluatorService } from "./infrastructure/cap-evaluator.service";
import { CapDoc, CapSchema } from "./infrastructure/cap.schema";
import { PolicyService } from "./infrastructure/policy.service";
import { QuotaDoc, QuotaSchema } from "./infrastructure/quota.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CapDoc.name, schema: CapSchema },
      { name: QuotaDoc.name, schema: QuotaSchema },
    ]),
    EnvModule,
    MediaModule,
    forwardRef(() => ModelsModule),
  ],
  providers: [PolicyService, CapEvaluatorService],
  exports: [PolicyService],
})
export class PolicyModule {}
