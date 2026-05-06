import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule } from "@open-dpp/env";
import { EmailModule } from "../../email/email.module";
import { AuthModule } from "../auth/auth.module";
import { EmailChangeRequestsService } from "./application/services/email-change-requests.service";
import { EmailChangeRequestsRepository } from "./infrastructure/adapters/email-change-requests.repository";
import {
  EmailChangeRequest as EmailChangeRequestSchemaClass,
  EmailChangeRequestSchema,
} from "./infrastructure/schemas/email-change-request.schema";
import { RevokeEmailChangeController } from "./presentation/revoke-email-change.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailChangeRequestSchemaClass.name, schema: EmailChangeRequestSchema },
    ]),
    EnvModule,
    forwardRef(() => AuthModule),
    EmailModule,
  ],
  providers: [EmailChangeRequestsService, EmailChangeRequestsRepository],
  controllers: [RevokeEmailChangeController],
  exports: [EmailChangeRequestsService],
})
export class EmailChangeRequestsModule {}
