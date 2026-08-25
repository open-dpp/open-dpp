import { ISubmodelElement } from "../../domain/submodel-base/submodel-base";
import {
  ApiVersionsDto,
  type ApiVersionsDtoType,
  type SubmodelElementResponseDto,
  SubmodelElementSchema,
} from "@open-dpp/dto";
import { AasAbility } from "../../domain/security/aas-ability";
import { reverseMigrateSubmodelElementLinks } from "../../infrastructure/migrate-links";
import { isEmptyObject } from "../../../utils";
import { ForbiddenError } from "@open-dpp/exception";

export class SubmodelElementResponse {
  private constructor(
    public readonly submodelElement: ISubmodelElement,
    public readonly version: ApiVersionsDtoType,
    public readonly ability: AasAbility | undefined,
  ) {}

  static create(data: {
    submodelElement: ISubmodelElement;
    version: ApiVersionsDtoType;
    ability?: AasAbility;
  }) {
    return new SubmodelElementResponse(data.submodelElement, data.version, data.ability);
  }

  toJSON(): SubmodelElementResponseDto {
    const plain = this.submodelElement.toPlain({ ability: this.ability });

    if (isEmptyObject(plain)) {
      throw new ForbiddenError();
    }

    const migratedResult =
      this.version === ApiVersionsDto.v1 ? reverseMigrateSubmodelElementLinks(plain) : plain;

    return SubmodelElementSchema.parse(migratedResult);
  }
}
