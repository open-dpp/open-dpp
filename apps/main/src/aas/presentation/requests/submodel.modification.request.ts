import { SubmodelModificationDto } from "@open-dpp/dto";
import { ApiVersionsType } from "../../../api-version";

export class SubmodelModificationRequest {
  private constructor(
    private readonly body: SubmodelModificationDto,
    public readonly version: ApiVersionsType,
  ) {}
  static create(data: { body: SubmodelModificationDto; version: ApiVersionsType }) {
    return new SubmodelModificationRequest(data.body, data.version);
  }

  toDomain(): SubmodelModificationDto {
    return this.body;
  }
}
