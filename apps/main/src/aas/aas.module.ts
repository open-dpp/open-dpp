import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrganizationsModule } from "../organizations/organizations.module";
import { PassportRepository } from "./infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "./infrastructure/schemas/passport.schema";
import { PassportController } from "./presentation/passport.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PassportDoc.name,
        schema: PassportSchema,
      },
    ]),
    OrganizationsModule,
  ],
  controllers: [PassportController],
  providers: [PassportRepository],
  exports: [PassportRepository],
})
export class AasModule {}
