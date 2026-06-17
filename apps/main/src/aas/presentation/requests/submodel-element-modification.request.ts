import { SubmodelElementModificationDto, SubmodelModificationDto } from "@open-dpp/dto";
import { ApiVersionsType } from "../../../api-version";

export class SubmodelElementModificationRequest {
  private constructor(
    private readonly body: SubmodelElementModificationDto,
    public readonly version: ApiVersionsType,
  ) {}
  static create(data: { body: SubmodelModificationDto; version: ApiVersionsType }) {
    return new SubmodelElementModificationRequest(data.body, data.version);
  }

  toDomain(): SubmodelElementModificationDto {
    return this.body;
  }
}
