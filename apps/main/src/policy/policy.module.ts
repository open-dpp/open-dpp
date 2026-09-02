import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule } from "@open-dpp/env";
import { OrganizationsModule } from "../identity/organizations/organizations.module";
import { MediaDbSchema, MediaDoc } from "../media/infrastructure/media.schema";
import { MediaService } from "../media/infrastructure/media.service";
import { PassportRepository } from "../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../passports/infrastructure/passport.schema";
import { LimitEvaluatorService } from "./infrastructure/limit-evaluator.service";
import { PolicyInitializerService } from "./infrastructure/policy-initializer.service";
import { LimitRepository } from "./infrastructure/limit.repository";
import { LimitDoc, LimitSchema } from "./infrastructure/limit.schema";
import { PolicyService } from "./infrastructure/policy.service";
import { QuotaRepository } from "./infrastructure/quota.repository";
import { QuotaDoc, QuotaSchema } from "./infrastructure/quota.schema";
import { PolicyController } from "./presentation/policy.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LimitDoc.name, schema: LimitSchema },
      { name: QuotaDoc.name, schema: QuotaSchema },
      { name: MediaDoc.name, schema: MediaDbSchema },
      { name: PassportDoc.name, schema: PassportSchema },
    ]),
    EnvModule,
    forwardRef(() => OrganizationsModule),
  ],
  controllers: [PolicyController],
  providers: [
    PolicyService,
    PolicyInitializerService,
    LimitEvaluatorService,
    LimitRepository,
    QuotaRepository,
    MediaService,
    PassportRepository,
  ],
  exports: [PolicyService],
})
export class PolicyModule {}
