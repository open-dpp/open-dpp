import { SubmodelElementRequestDto } from "@open-dpp/dto";
import { ApiVersions, ApiVersionsType } from "../../../api-version";
import { ISubmodelElement, parseSubmodelElement } from "../../domain/submodel-base/submodel-base";
import { migrateSubmodelElementLinks } from "../../infrastructure/migrate-links";

export class SubmodelElementRequest {
  private constructor(
    public readonly body: SubmodelElementRequestDto,
    public readonly version: ApiVersionsType,
  ) {}
  static create(data: { body: SubmodelElementRequestDto; version: ApiVersionsType }) {
    return new SubmodelElementRequest(data.body, data.version);
  }

  toDomain(): ISubmodelElement {
    const migrated =
      this.version === ApiVersions.v1 ? migrateSubmodelElementLinks(this.body) : this.body;
    return parseSubmodelElement(migrated);
  }
}
