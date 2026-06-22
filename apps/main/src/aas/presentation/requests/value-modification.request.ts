import {
  ApiVersionsDto,
  type ApiVersionsDtoType,
  type ValueRequestDto,
  ValueSchema,
} from "@open-dpp/dto";
import { migrateLinksInValueRepresentation } from "../../infrastructure/migrate-links";

export class ValueModificationRequest {
  private constructor(
    public readonly body: ValueRequestDto,
    public readonly version: ApiVersionsDtoType,
  ) {}
  static create(data: { body: ValueRequestDto; version: ApiVersionsDtoType }) {
    return new ValueModificationRequest(data.body, data.version);
  }

  toDomain(): ValueRequestDto {
    const migrated =
      this.version === ApiVersionsDto.v1 ? migrateLinksInValueRepresentation(this.body) : this.body;
    return ValueSchema.parse(migrated);
  }
}
