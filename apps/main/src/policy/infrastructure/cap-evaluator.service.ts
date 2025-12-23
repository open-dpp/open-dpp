import { Injectable } from "@nestjs/common";
import { MediaService } from "../../media/infrastructure/media.service";
import { ModelsService } from "../../models/infrastructure/models.service";
import { PolicyKey } from "../domain/policy";

@Injectable()
export class CapEvaluatorService {
  constructor(private modelService: ModelsService, private mediaService: MediaService) {}

  async getCurrent(orgId: string, key: PolicyKey): Promise<number> {
    switch (key) {
      case PolicyKey.MODEL_CREATE_CAP:
        return this.modelService.countByOrganization(orgId);
      case PolicyKey.MEDIA_STORAGE_CAP: {
        const bytesUsed = await this.mediaService.calculateOrganizationStorageUsage(orgId);
        return Math.floor(bytesUsed / (1024 * 1024));
      }
      default:
        throw new Error(`No cap evaluator registered for ${key}`);
    }
  }
}
