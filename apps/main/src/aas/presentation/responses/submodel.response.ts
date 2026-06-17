import { Submodel } from "../../domain/submodel-base/submodel";
import { ApiVersions, ApiVersionsType } from "../../../api-version";
import { SubmodelJsonSchema, SubmodelResponseDto } from "@open-dpp/dto";
import { AasAbility } from "../../domain/security/aas-ability";
import { reverseMigrateSubmodelLinks } from "../../infrastructure/migrate-links";
import { isEmptyObject } from "../../../utils";
import { ForbiddenError } from "@open-dpp/exception";

export class SubmodelResponse {
  private constructor(
    public readonly submodel: Submodel,
    public readonly version: ApiVersionsType,
    public readonly ability: AasAbility | undefined,
  ) {}
  static create(data: { submodel: Submodel; version: ApiVersionsType; ability?: AasAbility }) {
    return new SubmodelResponse(data.submodel, data.version, data.ability);
  }

  toJSON(): SubmodelResponseDto {
    const plain = this.submodel.toPlain({ ability: this.ability });

    if (isEmptyObject(plain)) {
      throw new ForbiddenError();
    }

    const migratedResult =
      this.version === ApiVersions.v1 ? reverseMigrateSubmodelLinks(plain) : plain;

    return SubmodelJsonSchema.parse(migratedResult);
  }
}
