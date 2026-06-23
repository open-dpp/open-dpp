import { ApiVersionsDto, type ApiVersionsDtoType, type SubmodelRequestDto } from "@open-dpp/dto";
import { migrateSubmodelLinks } from "../../infrastructure/migrate-links";
import { Submodel } from "../../domain/submodel-base/submodel";

export class SubmodelRequest {
  private constructor(
    public readonly body: SubmodelRequestDto,
    public readonly version: ApiVersionsDtoType,
  ) {}
  static create(data: { body: SubmodelRequestDto; version: ApiVersionsDtoType }) {
    return new SubmodelRequest(data.body, data.version);
  }

  toDomain(): Submodel {
    const migrated =
      this.version === ApiVersionsDto.v1 ? migrateSubmodelLinks(this.body) : this.body;
    return Submodel.fromPlain(migrated);
  }
}
