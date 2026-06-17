import { ValueRequestDto, ValueSchema } from "@open-dpp/dto";
import { ApiVersions, ApiVersionsType } from "../../../api-version";
import { migrateLinksInValueRepresentation } from "../../infrastructure/migrate-links";

export class ValueModificationRequest {
  private constructor(
    public readonly body: ValueRequestDto,
    public readonly version: ApiVersionsType,
  ) {}
  static create(data: { body: ValueRequestDto; version: ApiVersionsType }) {
    return new ValueModificationRequest(data.body, data.version);
  }

  toDomain(): ValueRequestDto {
    const migrated =
      this.version === ApiVersions.v1 ? migrateLinksInValueRepresentation(this.body) : this.body;
    return ValueSchema.parse(migrated);
  }
}
