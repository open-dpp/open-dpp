import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CapDoc, CapSchema } from "./infrastructure/cap.schema";
import { PolicyService } from "./infrastructure/policy.service";
import { QuotaDoc, QuotaSchema } from "./infrastructure/quota.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CapDoc.name, schema: CapSchema },
      { name: QuotaDoc.name, schema: QuotaSchema },
    ]),
  ],
  providers: [PolicyService],
  exports: [PolicyService],
})
export class PolicyModule {}
