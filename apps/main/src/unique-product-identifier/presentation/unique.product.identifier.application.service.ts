import { Injectable, NotFoundException } from "@nestjs/common";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { UniqueProductIdentifierRepository } from "../infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierMetadataDtoSchema,
} from "./dto/unique-product-identifier-dto.schema";

@Injectable()
export class UniqueProductIdentifierApplicationService {
  constructor(
    private readonly uniqueProductIdentifierService: UniqueProductIdentifierRepository,
    private readonly passportRepository: PassportRepository,
  ) {}

  async getMetadataByUniqueProductIdentifierOrFail(
    uniqueProductIdentifierId: string,
  ) {
    const metadata = await this.getMetadataByUniqueProductIdentifier(uniqueProductIdentifierId);
    if (!metadata) {
      throw new NotFoundException(`Metadata of uniqueProductIdentifier ${uniqueProductIdentifierId} not found`);
    }
    return metadata;
  }

  async getMetadataByUniqueProductIdentifier(
    uniqueProductIdentifierId: string,
  ) {
    const uniqueProductIdentifier
      = await this.uniqueProductIdentifierService.findOneOrFail(
        uniqueProductIdentifierId,
      );
    const passport = await this.passportRepository.findOne(uniqueProductIdentifier.referenceId);

    if (!passport) {
      return undefined;
    }

    return UniqueProductIdentifierMetadataDtoSchema.parse({
      organizationId: passport.organizationId,
      passportId: passport.id,
      templateId: passport.templateId,
    });
  }
}
