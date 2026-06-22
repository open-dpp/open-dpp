import { ApiVersionsDtoType, SubmodelElementModificationDto } from "@open-dpp/dto";

export class SubmodelElementModificationRequest {
  private constructor(
    private readonly body: SubmodelElementModificationDto,
    public readonly version: ApiVersionsDtoType,
  ) {}
  static create(data: { body: SubmodelElementModificationDto; version: ApiVersionsDtoType }) {
    return new SubmodelElementModificationRequest(data.body, data.version);
  }

  toDomain(): SubmodelElementModificationDto {
    return this.body;
  }
}
