import { Get, Param } from "@nestjs/common";
import {
  IDigitalProductPassportIdentifiableRepository,
} from "../infrastructure/digital-product-passport-identifiable.repository";

export class AasController {
  constructor(public dppIdentifiableRepository: IDigitalProductPassportIdentifiableRepository) {}

  @Get("/:id/submodels")
  async getSubmodels(@Param("orgaId") organizationId: string, @Param("id") id: string): Promise<any> {
    console.log(organizationId, id);
    const dppIdentifiable = await this.dppIdentifiableRepository.findOneOrFail(id);
  }
}
