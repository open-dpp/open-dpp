import { Module } from '@nestjs/common';
import { McpModuleService } from './mcp-module.service';

@Module({
  providers: [McpModuleService],
  exports: [McpModuleService],
})
export class McpModuleModule {}
