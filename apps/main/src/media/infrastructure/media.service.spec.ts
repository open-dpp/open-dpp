import type { TestingModule } from '@nestjs/testing'
import { Buffer } from 'node:buffer'
import { expect } from '@jest/globals'
import { ConfigModule } from '@nestjs/config'
import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { NotFoundInDatabaseException } from '@open-dpp/exception'
import { Media } from '../domain/media'
import { MediaDoc } from './media.schema'
import { MediaService } from './media.service'

// Mocks for external modules
const mockMinioClient = {
  bucketExists: jest.fn(),
  putObject: jest.fn(),
  getObject: jest.fn(),
}

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => mockMinioClient),
}))

const sharpToBufferResult = Buffer.from('optimized')
const mockSharpPipeline = {
  resize: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(sharpToBufferResult),
}
jest.mock('sharp', () => jest.fn(() => mockSharpPipeline))

const mockFileType = { ext: 'png', mime: 'image/png' } as any
jest.mock('./file-type-util', () => ({
  fileTypeFromBuffer: jest.fn(async () => mockFileType),
}))

// Helper: build a MediaDoc-like object
function makeMediaDoc(overrides: Partial<MediaDoc & { _id: string }> = {}) {
  const now = new Date()
  return {
    _id: overrides._id ?? 'id-1',
    ownedByOrganizationId: overrides.ownedByOrganizationId ?? 'org-1',
    createdByUserId: overrides.createdByUserId ?? 'user-1',
    title: overrides.title ?? 'title',
    description: overrides.description ?? 'desc',
    mimeType: overrides.mimeType ?? 'image/png',
    fileExtension: overrides.fileExtension ?? 'png',
    size: overrides.size ?? 123,
    originalFilename: overrides.originalFilename ?? 'file.png',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    uniqueProductIdentifier: overrides.uniqueProductIdentifier ?? 'upi-1',
    dataFieldId: overrides.dataFieldId ?? 'df-1',
    bucket: overrides.bucket ?? 'bucket-default',
    objectName: overrides.objectName ?? 'path/to/object',
    eTag: overrides.eTag ?? 'etag',
    versionId: overrides.versionId ?? 'v1',
  } as unknown as MediaDoc
}

// Mock Mongoose Model
const mockModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteMany: jest.fn(),
  deleteOne: jest.fn(),
}

describe('mediaService', () => {
  let service: MediaService

  beforeEach(async () => {
    jest.clearAllMocks()

    // Ensure config values exist
    process.env.S3_ENDPOINT = 's3.local'
    process.env.S3_PORT = '9000'
    process.env.S3_SSL = 'false'
    process.env.S3_ACCESS_KEY = 'ak'
    process.env.S3_SECRET_KEY = 'sk'
    process.env.S3_BUCKET_NAME_DEFAULT = 'bucket-default'
    process.env.S3_BUCKET_NAME_PROFILE_PICTURES = 'bucket-profile'

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        MediaService,
        {
          provide: getModelToken(MediaDoc.name),
          useValue: mockModel,
        },
      ],
    }).compile()

    service = module.get<MediaService>(MediaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('buildBucketPath', () => {
    it('joins folders and object with "/"', () => {
      expect(service.buildBucketPath('file.txt', ['a', 'b'])).toBe(
        'a/b/file.txt',
      )
    })
    it('works with no folders', () => {
      expect(service.buildBucketPath('file.txt')).toBe('file.txt')
    })
  })

  describe('uploadFile', () => {
    it('uploads when bucket exists', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true)
      const uploadInfo = { etag: 'e', versionId: 'v' }
      mockMinioClient.putObject.mockResolvedValue(uploadInfo)
      const res = await service.uploadFile(
        'bucket-default',
        Buffer.from('abc'),
        'base',
        ['dir'],
        3,
        'text/plain',
      )
      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith(
        'bucket-default',
      )
      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'bucket-default',
        'dir/base',
        expect.any(Buffer),
        3,
        { 'Content-Type': 'text/plain' },
      )
      expect(res).toEqual({
        info: uploadInfo,
        location: { bucket: 'bucket-default', objectName: 'dir/base' },
      })
    })

    it('throws if bucket does not exist', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false)
      await expect(
        service.uploadFile('bucket-x', Buffer.alloc(0), 'f', [], 0, 'x/y'),
      ).rejects.toThrow('Bucket bucket-x does not exist')
    })
  })

  describe('uploadProfilePicture', () => {
    it('delegates to uploadFile with profile bucket and webp', async () => {
      const spy = jest.spyOn(service, 'uploadFile').mockResolvedValue({
        info: {},
        location: { bucket: 'bucket-profile', objectName: 'user-1' },
      } as any)
      const buf = Buffer.from('img')
      await service.uploadProfilePicture(buf, 'user-1')
      expect(spy).toHaveBeenCalledWith(
        'bucket-profile',
        buf,
        'user-1',
        [],
        buf.length,
        'image/webp',
      )
    })
  })

  describe('uploadFileOfProductPassport', () => {
    it('optimizes images, uploads, deletes old, and saves media', async () => {
      // existing documents found -> triggers deleteMany
      mockModel.find.mockResolvedValue([makeMediaDoc({ _id: 'old' })])
      mockModel.deleteMany.mockResolvedValue({ acknowledged: true })

      // uploadFile result
      jest.spyOn(service, 'uploadFile').mockResolvedValue({
        info: { etag: 'e1', versionId: 'v1' },
        location: {
          bucket: 'bucket-default',
          objectName: 'product-passport-files/upi-9/df-9',
        },
      } as any)

      // save path: return doc from DB
      const savedDoc = makeMediaDoc({
        _id: 'new-id',
        dataFieldId: 'df-9',
        uniqueProductIdentifier: 'upi-9',
        bucket: 'bucket-default',
        objectName: 'product-passport-files/upi-9/df-9',
        eTag: 'e1',
        versionId: 'v1',
        mimeType: 'image/png',
        fileExtension: 'png',
        title: 'orig.png',
        description: 'orig.png',
        size: 4,
        originalFilename: 'orig.png',
      })
      mockModel.findOneAndUpdate.mockResolvedValue(savedDoc)

      const inputBuffer = Buffer.from('imgdata')
      const media = await service.uploadFileOfProductPassport(
        'orig.png',
        inputBuffer,
        'df-9',
        'upi-9',
        'creator-1',
        'org-1',
      )

      // file-type says image => sharp used
      expect(mockSharpPipeline.resize).toHaveBeenCalledWith({
        width: 480,
        height: 480,
        fit: 'cover',
      })
      expect(mockSharpPipeline.webp).toHaveBeenCalledWith({ quality: 85 })
      expect(mockSharpPipeline.toBuffer).toHaveBeenCalled()

      // old delete
      expect(mockModel.deleteMany).toHaveBeenCalledWith({
        dataFieldId: 'df-9',
        uniqueProductIdentifier: 'upi-9',
      })

      // upload called with transformed buffer and path
      expect(service.uploadFile).toHaveBeenCalledWith(
        'bucket-default',
        sharpToBufferResult,
        'df-9',
        ['product-passport-files', 'upi-9'],
        sharpToBufferResult.length,
        'image/webp',
      )

      // saved via save() -> findOneAndUpdate called with upsert
      expect(mockModel.findOneAndUpdate).toHaveBeenCalled()

      expect(media).toBeInstanceOf(Media)
      expect(media.objectName).toContain('product-passport-files')
      expect(media.mimeType).toBe('image/webp')
    })

    it('does not optimize non-images', async () => {
      // change mock file type to non-image for this test
      const { fileTypeFromBuffer } = jest.requireMock('./file-type-util');
      (fileTypeFromBuffer as jest.Mock).mockResolvedValueOnce({
        ext: 'pdf',
        mime: 'application/pdf',
      })

      mockModel.find.mockResolvedValue([])
      jest.spyOn(service, 'uploadFile').mockResolvedValue({
        info: {},
        location: { bucket: 'bucket-default', objectName: 'x' },
      } as any)
      mockModel.findOneAndUpdate.mockResolvedValue(makeMediaDoc())

      const buf = Buffer.from('%PDF')
      await service.uploadFileOfProductPassport(
        'a.pdf',
        buf,
        'df',
        'upi',
        'creator',
        'org',
      )
      expect(mockSharpPipeline.resize).not.toHaveBeenCalled()
    })
  })

  describe('getFileStream', () => {
    it('returns stream when bucket exists', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true)
      const fakeStream = {} as any
      mockMinioClient.getObject.mockResolvedValue(fakeStream)
      const res = await service.getFileStream('bucket-default', 'file', ['a'])
      expect(res).toBe(fakeStream)
      expect(mockMinioClient.getObject).toHaveBeenCalledWith(
        'bucket-default',
        'a/file',
      )
    })
    it('throws when bucket missing', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false)
      await expect(service.getFileStream('b', 'f', [])).rejects.toThrow(
        'Bucket does not exist',
      )
    })
  })

  describe('find and streams helpers', () => {
    it('getFilestreamOfProductPassport returns media and stream', async () => {
      // set up findOneDpp -> uses model.find
      const doc = makeMediaDoc({ _id: 'm1', bucket: 'b', objectName: 'o' })
      mockModel.find.mockResolvedValue([doc])

      mockMinioClient.bucketExists.mockResolvedValue(true)
      const s = {} as any
      mockMinioClient.getObject.mockResolvedValue(s)

      const res = await service.getFilestreamOfProductPassport('df-1', 'upi-1')
      expect(res.media.id).toBe('m1')
      expect(res.stream).toBe(s)
    })

    it('getFilestreamById returns media and stream', async () => {
      const doc = makeMediaDoc({ _id: 'm2', bucket: 'b2', objectName: 'o2' })
      mockModel.findById.mockResolvedValue(doc)
      mockMinioClient.bucketExists.mockResolvedValue(true)
      const s = {} as any
      mockMinioClient.getObject.mockResolvedValue(s)

      const res = await service.getFilestreamById('m2')
      expect(res.media.id).toBe('m2')
      expect(res.stream).toBe(s)
    })
  })

  describe('convert/save/find/remove', () => {
    it('convertToDomain maps fields', () => {
      const doc = makeMediaDoc({ _id: 'm3', title: 'T' })
      const media = service.convertToDomain(doc)
      expect(media).toBeInstanceOf(Media)
      expect(media.id).toBe('m3')
      expect(media.title).toBe('T')
    })

    it('save upserts and returns domain', async () => {
      const media = Media.create({
        ownedByOrganizationId: 'org',
        createdByUserId: 'u',
        title: 't',
        description: 'd',
        mimeType: 'image/png',
        fileExtension: 'png',
        size: 1,
        originalFilename: 'f',
        uniqueProductIdentifier: 'upi',
        dataFieldId: 'df',
        bucket: 'b',
        objectName: 'o',
        eTag: 'e',
        versionId: 'v',
      })
      const saved = makeMediaDoc({ _id: media.id, title: 't' })
      mockModel.findOneAndUpdate.mockResolvedValue(saved)
      const res = await service.save(media)
      expect(res).toBeInstanceOf(Media)
      expect(res.id).toBe(media.id)
      expect(mockModel.findOneAndUpdate).toHaveBeenCalled()
    })

    it('findOneOrFail throws when not found', async () => {
      mockModel.findById.mockResolvedValue(null)
      await expect(service.findOneOrFail('x')).rejects.toBeInstanceOf(
        NotFoundInDatabaseException,
      )
    })

    it('findOneDppFileOrFail returns first or throws', async () => {
      mockModel.find.mockResolvedValueOnce([])
      await expect(
        service.findOneDppFileOrFail('df', 'upi'),
      ).rejects.toBeInstanceOf(NotFoundInDatabaseException)
      const doc = makeMediaDoc({ _id: 'm4' })
      mockModel.find.mockResolvedValueOnce([doc])
      const media = await service.findOneDppFileOrFail('df', 'upi')
      expect(media.id).toBe('m4')
    })

    it('findAll maps all', async () => {
      mockModel.find.mockResolvedValue([
        makeMediaDoc({ _id: 'a' }),
        makeMediaDoc({ _id: 'b' }),
      ])
      const list = await service.findAll()
      expect(list.map(m => m.id)).toEqual(['a', 'b'])
    })

    it('removeById calls deleteOne', async () => {
      mockModel.deleteOne.mockResolvedValue({ acknowledged: true })
      await service.removeById('z')
      expect(mockModel.deleteOne).toHaveBeenCalledWith({ _id: 'z' })
    })

    it('findAllByOrganizationId filters and maps', async () => {
      mockModel.find.mockResolvedValue([
        makeMediaDoc({ _id: 'a', ownedByOrganizationId: 'orgX' }),
      ])
      const list = await service.findAllByOrganizationId('orgX')
      expect(mockModel.find).toHaveBeenCalledWith(
        { ownedByOrganizationId: 'orgX' },
        {
          _id: true,
          ownedByOrganizationId: true,
          createdByUserId: true,
          title: true,
          description: true,
          mimeType: true,
          fileExtension: true,
          size: true,
          bucket: true,
          createdAt: true,
          dataFieldId: true,
          eTag: true,
          objectName: true,
          uniqueProductIdentifier: true,
          updatedAt: true,
          versionId: true,
          originalFilename: true,
        },
      )
      expect(list[0]).toBeInstanceOf(Media)
      expect(list[0].ownedByOrganizationId).toBe('orgX')
    })
  })
})
