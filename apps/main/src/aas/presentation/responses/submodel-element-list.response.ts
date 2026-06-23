import { ISubmodelElement } from "../../domain/submodel-base/submodel-base";
import {
  ApiVersionsDtoType,
  SubmodelElementListJsonSchema,
  SubmodelElementListResponseDto,
} from "@open-dpp/dto";
import { AasAbility } from "../../domain/security/aas-ability";
import { SubmodelElementResponse } from "./submodel-element.response";

export class SubmodelElementListResponse {
  private constructor(private readonly submodelElementResponse: SubmodelElementResponse) {}

  static create(data: {
    submodelElement: ISubmodelElement;
    version: ApiVersionsDtoType;
    ability?: AasAbility;
  }) {
    return new SubmodelElementListResponse(SubmodelElementResponse.create(data));
  }

  toJSON(): SubmodelElementListResponseDto {
    return SubmodelElementListJsonSchema.parse(this.submodelElementResponse.toJSON());
  }
}
