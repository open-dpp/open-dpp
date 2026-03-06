import { Module } from "@nestjs/common";
import { EnvModule } from "@open-dpp/env";
import { McpModule } from "@rekog/mcp-nest";
import { AuthModule } from "../identity/auth/auth.module";
import { OrganizationsModule } from "../identity/organizations/organizations.module";

import { PassportsModule } from "../passports/passports.module";
import { UniqueProductIdentifierModule } from "../unique-product-identifier/unique.product.identifier.module";
import { PassportTool } from "./passport.tool";

@Module({
  imports: [
    EnvModule.forRoot(),
    McpModule.forRoot({
      name: "mcp-server",
      version: "1.0.0",
    }),
    UniqueProductIdentifierModule,
    AuthModule,
    OrganizationsModule,
    PassportsModule,
  ],
  providers: [PassportTool],
})
export class McpServerModule { }
