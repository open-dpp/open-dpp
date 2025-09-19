import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DppService } from './dpp.service';
import { PassportTool } from './passport.tool';
// import { McpModule } from '@rekog/mcp-nest';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    /* McpModule.forRoot({
      name: 'my-mcp-server',
      version: '1.0.0',
    }), */
  ],
  controllers: [],
  providers: [PassportTool, DppService],
})
export class McpAppModule {}
