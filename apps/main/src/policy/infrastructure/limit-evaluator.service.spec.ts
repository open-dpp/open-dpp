import { expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { MediaService } from "../../media/infrastructure/media.service";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PolicyKey } from "../domain/policy-rules";
import { LimitEvaluatorService } from "./limit-evaluator.service";

describe("limitEvaluatorService", () => {
  let service: LimitEvaluatorService;
  let mediaService: any;
  let passportRepository: any;

  beforeEach(async () => {
    mediaService = {
      calculateOrganizationStorageUsage: jest.fn(),
    };
    passportRepository = {
      countByOrganizationId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LimitEvaluatorService,
        { provide: MediaService, useValue: mediaService },
        { provide: PassportRepository, useValue: passportRepository },
      ],
    }).compile();

    service = module.get<LimitEvaluatorService>(LimitEvaluatorService);
  });

  describe("PASSPORT_CREATE_LIMIT", () => {
    it("should return the number of passports the organization has created", async () => {
      passportRepository.countByOrganizationId.mockResolvedValue(7);

      const used = await service.getCurrent("org-1", PolicyKey.PASSPORT_CREATE_LIMIT);

      expect(used).toBe(7);
      expect(passportRepository.countByOrganizationId).toHaveBeenCalledWith("org-1");
    });

    it("should return 0 for an organization without passports", async () => {
      passportRepository.countByOrganizationId.mockResolvedValue(0);

      await expect(service.getCurrent("org-1", PolicyKey.PASSPORT_CREATE_LIMIT)).resolves.toBe(0);
    });

    it("should not consult the media service", async () => {
      passportRepository.countByOrganizationId.mockResolvedValue(3);

      await service.getCurrent("org-1", PolicyKey.PASSPORT_CREATE_LIMIT);

      expect(mediaService.calculateOrganizationStorageUsage).not.toHaveBeenCalled();
    });
  });

  describe("MEDIA_STORAGE_LIMIT", () => {
    it("should return the storage usage in MB rounded to two decimals", async () => {
      mediaService.calculateOrganizationStorageUsage.mockResolvedValue(1024 * 1024 * 1.5);

      const used = await service.getCurrent("org-1", PolicyKey.MEDIA_STORAGE_LIMIT);

      expect(used).toBe(1.5);
    });
  });

  it("should throw for a key without a registered evaluator", async () => {
    await expect(service.getCurrent("org-1", PolicyKey.AI_TOKEN_QUOTA)).rejects.toThrow(
      "No limit evaluator registered",
    );
  });
});
