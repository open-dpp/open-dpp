import { Module } from "@nestjs/common";
import { EnvModule } from "@open-dpp/env";
import { McpModule } from "@rekog/mcp-nest";
import { DppService } from "./dpp.service";
import { PassportTool } from "./passport.tool";

@Module({
  imports: [
    EnvModule.forRoot(),
    McpModule.forRoot({
      name: "my-mcp-server",
      version: "1.0.0",
    }),
  ],
  providers: [PassportTool, DppService],
})
export class AppModule {}
