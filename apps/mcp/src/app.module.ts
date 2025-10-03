import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { McpModule } from "@rekog/mcp-nest";
import { DppService } from "./dpp.service";
import { PassportTool } from "./passport.tool";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    McpModule.forRoot({
      name: "my-mcp-server",
      version: "1.0.0",
    }),
  ],
  providers: [PassportTool, DppService],
})
export class AppModule {}
