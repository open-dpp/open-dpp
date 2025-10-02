import type { TestingModule } from '@nestjs/testing'
import { expect } from '@jest/globals'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { MongooseTestingModule } from 'packages/testing/src/mongo.testing.module'
import { MediaDbSchema, MediaDoc } from '../infrastructure/media.schema'
import { MediaService } from '../infrastructure/media.service'
import { MediaController } from './media.controller'

describe('mediaController', () => {
  let controller: MediaController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: MediaDoc.name,
            schema: MediaDbSchema,
          },
        ]),
      ],
      providers: [MediaService],
      controllers: [MediaController],
    }).compile()

    controller = module.get<MediaController>(MediaController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
