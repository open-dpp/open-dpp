import { SubmodelRequestDto } from "@open-dpp/dto";
import { ApiVersions, ApiVersionsType } from "../../../api-version";
import { ISubmodelElement, parseSubmodelElement } from "../../domain/submodel-base/submodel-base";
import { migrateSubmodelLinks } from "../../infrastructure/migrate-links";
import { Submodel } from "../../domain/submodel-base/submodel";

export class SubmodelRequest {
  private constructor(
    public readonly body: SubmodelRequestDto,
    public readonly version: ApiVersionsType,
  ) {}
  static create(data: { body: SubmodelRequestDto; version: ApiVersionsType }) {
    return new SubmodelRequest(data.body, data.version);
  }

  toDomain(): Submodel {
    const migrated = this.version === ApiVersions.v1 ? migrateSubmodelLinks(this.body) : this.body;
    return Submodel.fromPlain(migrated);
  }
}
