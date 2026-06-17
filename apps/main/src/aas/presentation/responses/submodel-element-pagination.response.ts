import { PagingResult } from "../../../pagination/paging-result";
import { ISubmodelElement } from "../../domain/submodel-base/submodel-base";
import { ApiVersions, ApiVersionsType } from "../../../api-version";
import {
  SubmodelElementPaginationResponseDto,
  SubmodelElementPaginationResponseDtoSchema,
} from "@open-dpp/dto";
import { AasAbility } from "../../domain/security/aas-ability";
import { reverseMigrateSubmodelElementLinks } from "../../infrastructure/migrate-links";

export class SubmodelElementPaginationResponse {
  private constructor(
    public readonly pagingResult: PagingResult<ISubmodelElement>,
    public readonly version: ApiVersionsType,
    public readonly ability: AasAbility,
  ) {}

  static create(data: {
    pagingResult: PagingResult<ISubmodelElement>;
    version: ApiVersionsType;
    ability: AasAbility;
  }) {
    return new SubmodelElementPaginationResponse(data.pagingResult, data.version, data.ability);
  }

  toJSON(): SubmodelElementPaginationResponseDto {
    const plain = this.pagingResult.toPlain({ ability: this.ability });
    const migratedResult =
      this.version === ApiVersions.v1
        ? { ...plain, result: plain.result.map((s) => reverseMigrateSubmodelElementLinks(s)) }
        : plain;

    return SubmodelElementPaginationResponseDtoSchema.parse(migratedResult);
  }
}
