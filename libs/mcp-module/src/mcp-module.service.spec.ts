import { Test, TestingModule } from '@nestjs/testing';
import { McpModuleService } from './mcp-module.service';

describe('McpModuleService', () => {
  let service: McpModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [McpModuleService],
    }).compile();

    service = module.get<McpModuleService>(McpModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
