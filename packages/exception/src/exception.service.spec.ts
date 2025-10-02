import type { TestingModule } from '@nestjs/testing'
import { expect } from '@jest/globals'
import { Test } from '@nestjs/testing'
import { ExceptionService } from './exception.service'

describe('exceptionService', () => {
  let service: ExceptionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExceptionService],
    }).compile()

    service = module.get<ExceptionService>(ExceptionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
