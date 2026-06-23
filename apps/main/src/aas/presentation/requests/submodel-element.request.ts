import {
  ApiVersionsDto,
  type ApiVersionsDtoType,
  type SubmodelElementRequestDto,
} from "@open-dpp/dto";
import { ISubmodelElement, parseSubmodelElement } from "../../domain/submodel-base/submodel-base";
import { migrateSubmodelElementLinks } from "../../infrastructure/migrate-links";

export class SubmodelElementRequest {
  private constructor(
    public readonly body: SubmodelElementRequestDto,
    public readonly version: ApiVersionsDtoType,
  ) {}
  static create(data: { body: SubmodelElementRequestDto; version: ApiVersionsDtoType }) {
    return new SubmodelElementRequest(data.body, data.version);
  }

  toDomain(): ISubmodelElement {
    const migrated =
      this.version === ApiVersionsDto.v1 ? migrateSubmodelElementLinks(this.body) : this.body;
    return parseSubmodelElement(migrated);
  }
}
