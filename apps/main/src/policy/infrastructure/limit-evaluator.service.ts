import { Injectable } from "@nestjs/common";
import { MediaService } from "../../media/infrastructure/media.service";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PolicyKey, PolicyKeyList } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { MembersRepository } from "../../identity/organizations/infrastructure/adapters/members.repository";

@Injectable()
export class LimitEvaluatorService {
  constructor(
    private mediaService: MediaService,
    private passportRepository: PassportRepository,
    private membersRepository: MembersRepository,
  ) {}

  async getCurrent(orgId: string, key: PolicyKey): Promise<number> {
    switch (key) {
      case PolicyKeyList.MEDIA_STORAGE_LIMIT: {
        const bytesUsed = await this.mediaService.calculateOrganizationStorageUsage(orgId);
        return bytesUsed / (1024 * 1024);
      }
      case PolicyKeyList.PASSPORT_CREATE_LIMIT:
        return await this.passportRepository.countByOrganizationId(orgId);
      case PolicyKeyList.ORGANIZATION_MEMBER_LIMIT:
        return await this.membersRepository.countByOrganizationId(orgId);
      default:
        throw new ValueError(`No limit evaluator registered for ${key}`);
    }
  }
}
