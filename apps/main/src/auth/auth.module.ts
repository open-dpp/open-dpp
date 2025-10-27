import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { EnvModule } from "@open-dpp/env";
import { EmailModule } from "../email/email.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SkipBodyParsingMiddleware } from "./skip-body-parsing.middleware";

@Module({
  imports: [
    EnvModule.forRoot(),
    EmailModule,
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    AuthService,
  ],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(SkipBodyParsingMiddleware).forRoutes(AuthController);
  }
}
