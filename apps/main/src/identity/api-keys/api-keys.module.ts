import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { ApiKeysService } from "./application/services/api-keys.service";
import { ApiKeysRepository } from "./infrastructure/api-keys.repository";
import { ApiKeyDoc, ApiKeySchema } from "./infrastructure/schemas/api-key.schema";
import { ApiKeysController } from "./presentation/api-keys.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ApiKeyDoc.name, schema: ApiKeySchema }]),
    AuthModule,
  ],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeysRepository],
})
export class ApiKeysModule {}
