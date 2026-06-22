import { PagingResult } from "../../../pagination/paging-result";
import { ISubmodelElement } from "../../domain/submodel-base/submodel-base";
import {
  ApiVersionsDto,
  ApiVersionsDtoType,
  SubmodelElementPaginationResponseDto,
  SubmodelElementPaginationResponseDtoSchema,
} from "@open-dpp/dto";
import { AasAbility } from "../../domain/security/aas-ability";
import { reverseMigrateSubmodelElementLinks } from "../../infrastructure/migrate-links";

export class SubmodelElementPaginationResponse {
  private constructor(
    public readonly pagingResult: PagingResult<ISubmodelElement>,
    public readonly version: ApiVersionsDtoType,
    public readonly ability: AasAbility,
  ) {}

  static create(data: {
    pagingResult: PagingResult<ISubmodelElement>;
    version: ApiVersionsDtoType;
    ability: AasAbility;
  }) {
    return new SubmodelElementPaginationResponse(data.pagingResult, data.version, data.ability);
  }

  toJSON(): SubmodelElementPaginationResponseDto {
    const plain = this.pagingResult.toPlain({ ability: this.ability });
    const migratedResult =
      this.version === ApiVersionsDto.v1
        ? { ...plain, result: plain.result.map((s) => reverseMigrateSubmodelElementLinks(s)) }
        : plain;

    return SubmodelElementPaginationResponseDtoSchema.parse(migratedResult);
  }
}
