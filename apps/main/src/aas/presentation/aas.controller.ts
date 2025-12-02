import { Get, Param } from "@nestjs/common";

import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { Pagination } from "../domain/pagination";
import { PagingResult } from "../domain/paging-result";
import {
  AssetAdministrationShellResponseDto,
  AssetAdministrationShellResponseDtoSchema,
} from "./dto/asset-administration-shell.dto";
import { EnvironmentService } from "./environment.service";

// Create a DTO from the schema
export class AasController {
  constructor(private readonly environmentService: EnvironmentService) {
  }

  @ApiOperation({
    summary: "Get shells",
    description: `Get shells`,
  })
  @ApiOkResponse({
    type: AssetAdministrationShellResponseDto,
  })
  @Get("/:id/shells")
  async getShells(@Param("orgaId") organizationId: string, @Param("id") id: string): Promise<AssetAdministrationShellResponseDto> {
    const pagination = Pagination.create({ limit: 1 });
    const shells = await this.environmentService.getAasShells(organizationId, id, pagination);
    return AssetAdministrationShellResponseDtoSchema.parse(PagingResult.create({ pagination, items: shells }).toPlain());
  }
}
