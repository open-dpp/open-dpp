import { Test, TestingModule } from '@nestjs/testing';
import { ExceptionService } from './exception.service';

describe('ExceptionService', () => {
  let service: ExceptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExceptionService],
    }).compile();

    service = module.get<ExceptionService>(ExceptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
