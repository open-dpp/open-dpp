import { Submodel } from "../../domain/submodel-base/submodel";
import { ApiVersions, ApiVersionsType } from "../../../api-version";
import { ValueResponseDto, ValueSchema } from "@open-dpp/dto";
import { AasAbility } from "../../domain/security/aas-ability";
import { reverseMigrateLinksInValueRepresentation } from "../../infrastructure/migrate-links";
import { IdShortPath } from "../../domain/common/id-short-path";
import { isEmptyObject } from "../../../utils";
import { ForbiddenError } from "@open-dpp/exception";

export class SubmodelBaseValueResponse {
  private constructor(
    public readonly submodel: Submodel,
    public readonly idShortPath: IdShortPath | undefined,
    public readonly version: ApiVersionsType,
    public readonly ability: AasAbility,
  ) {}
  static create(data: {
    submodel: Submodel;
    idShortPath?: IdShortPath;
    version: ApiVersionsType;
    ability: AasAbility;
  }) {
    return new SubmodelBaseValueResponse(
      data.submodel,
      data.idShortPath,
      data.version,
      data.ability,
    );
  }

  toJSON(): ValueResponseDto {
    const plain = this.submodel.getValueRepresentation({
      idShortPath: this.idShortPath,
      options: { ability: this.ability },
    });

    if (plain === undefined || (this.idShortPath && isEmptyObject(plain))) {
      throw new ForbiddenError();
    }

    const migratedResult =
      this.version === ApiVersions.v1 ? reverseMigrateLinksInValueRepresentation(plain) : plain;

    return ValueSchema.parse(migratedResult);
  }
}
