import { Submodel } from "../../domain/submodel-base/submodel";
import { ApiVersions, ApiVersionsType } from "../../../api-version";
import { ValueResponseDto, ValueSchema } from "@open-dpp/dto";
import { AasAbility } from "../../domain/security/aas-ability";
import { reverseMigrateLinksInValueRepresentation } from "../../infrastructure/migrate-links";

export class SubmodelValueResponse {
  private constructor(
    public readonly submodel: Submodel,
    public readonly version: ApiVersionsType,
    public readonly ability: AasAbility,
  ) {}
  static create(data: { submodel: Submodel; version: ApiVersionsType; ability: AasAbility }) {
    return new SubmodelValueResponse(data.submodel, data.version, data.ability);
  }

  toJSON(): ValueResponseDto {
    const plain = this.submodel.getValueRepresentation({ options: { ability: this.ability } });

    const migratedResult =
      this.version === ApiVersions.v1 ? reverseMigrateLinksInValueRepresentation(plain) : plain;

    return ValueSchema.parse(migratedResult);
  }
}
