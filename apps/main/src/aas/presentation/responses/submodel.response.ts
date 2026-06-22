import { Submodel } from "../../domain/submodel-base/submodel";
import {
  ApiVersionsDto,
  ApiVersionsDtoType,
  SubmodelJsonSchema,
  SubmodelResponseDto,
} from "@open-dpp/dto";
import { AasAbility } from "../../domain/security/aas-ability";
import { reverseMigrateSubmodelLinks } from "../../infrastructure/migrate-links";
import { isEmptyObject } from "../../../utils";
import { ForbiddenError } from "@open-dpp/exception";

export class SubmodelResponse {
  private constructor(
    public readonly submodel: Submodel,
    public readonly version: ApiVersionsDtoType,
    public readonly ability: AasAbility | undefined,
  ) {}
  static create(data: { submodel: Submodel; version: ApiVersionsDtoType; ability?: AasAbility }) {
    return new SubmodelResponse(data.submodel, data.version, data.ability);
  }

  toJSON(): SubmodelResponseDto {
    const plain = this.submodel.toPlain({ ability: this.ability });

    if (isEmptyObject(plain)) {
      throw new ForbiddenError();
    }

    const migratedResult =
      this.version === ApiVersionsDto.v1 ? reverseMigrateSubmodelLinks(plain) : plain;

    return SubmodelJsonSchema.parse(migratedResult);
  }
}
