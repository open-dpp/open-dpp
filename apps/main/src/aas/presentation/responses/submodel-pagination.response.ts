import { PagingResult } from "../../../pagination/paging-result";
import { Submodel } from "../../domain/submodel-base/submodel";
import {
  ApiVersionsDto,
  ApiVersionsDtoType,
  SubmodelPaginationResponseDto,
  SubmodelPaginationResponseDtoSchema,
} from "@open-dpp/dto";
import { AasAbility } from "../../domain/security/aas-ability";
import { reverseMigrateSubmodelLinks } from "../../infrastructure/migrate-links";

export class SubmodelPaginationResponse {
  private constructor(
    public readonly pagingResult: PagingResult<Submodel>,
    public readonly version: ApiVersionsDtoType,
    public readonly ability: AasAbility,
  ) {}
  static create(data: {
    pagingResult: PagingResult<Submodel>;
    version: ApiVersionsDtoType;
    ability: AasAbility;
  }) {
    return new SubmodelPaginationResponse(data.pagingResult, data.version, data.ability);
  }

  toJSON(): SubmodelPaginationResponseDto {
    const plain = this.pagingResult.toPlain({ ability: this.ability });
    const migratedResult =
      this.version === ApiVersionsDto.v1
        ? { ...plain, result: plain.result.map((s) => reverseMigrateSubmodelLinks(s)) }
        : plain;

    return SubmodelPaginationResponseDtoSchema.parse(migratedResult);
  }
}
