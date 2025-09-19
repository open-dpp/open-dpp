import { Test, TestingModule } from '@nestjs/testing';
import { MediaModuleService } from './media-module.service';

describe('MediaModuleService', () => {
  let service: MediaModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaModuleService],
    }).compile();

    service = module.get<MediaModuleService>(MediaModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
