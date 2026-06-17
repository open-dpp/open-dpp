import { ISubmodelElement } from "../../domain/submodel-base/submodel-base";
import { ApiVersions, ApiVersionsType } from "../../../api-version";
import { SubmodelElementResponseDto, SubmodelElementSchema } from "@open-dpp/dto";
import { AasAbility } from "../../domain/security/aas-ability";
import { reverseMigrateSubmodelElementLinks } from "../../infrastructure/migrate-links";
import { isEmptyObject } from "../../../utils";
import { ForbiddenError } from "@open-dpp/exception";

export class SubmodelElementResponse {
  private constructor(
    public readonly submodelElement: ISubmodelElement,
    public readonly version: ApiVersionsType,
    public readonly ability: AasAbility,
  ) {}

  static create(data: {
    submodelElement: ISubmodelElement;
    version: ApiVersionsType;
    ability: AasAbility;
  }) {
    return new SubmodelElementResponse(data.submodelElement, data.version, data.ability);
  }

  toJSON(): SubmodelElementResponseDto {
    const plain = this.submodelElement.toPlain({ ability: this.ability });

    if (isEmptyObject(plain)) {
      throw new ForbiddenError();
    }

    const migratedResult =
      this.version === ApiVersions.v1 ? reverseMigrateSubmodelElementLinks(plain) : plain;

    return SubmodelElementSchema.parse(migratedResult);
  }
}
