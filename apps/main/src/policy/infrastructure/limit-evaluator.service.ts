import { Injectable } from "@nestjs/common";
import { MediaService } from "../../media/infrastructure/media.service";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PolicyKey, PolicyKeyList } from "../domain/policy-rules";

@Injectable()
export class LimitEvaluatorService {
  constructor(
    private mediaService: MediaService,
    private passportRepository: PassportRepository,
  ) {}

  async getCurrent(orgId: string, key: PolicyKey): Promise<number> {
    switch (key) {
      case PolicyKeyList.MEDIA_STORAGE_LIMIT: {
        const bytesUsed = await this.mediaService.calculateOrganizationStorageUsage(orgId);
        const mbUsed = Math.round((bytesUsed / (1024 * 1024)) * 100) / 100;
        return mbUsed;
      }
      case PolicyKeyList.PASSPORT_CREATE_LIMIT:
        return await this.passportRepository.countByOrganizationId(orgId);
      default:
        throw new Error(`No limit evaluator registered for ${key}`);
    }
  }
}
