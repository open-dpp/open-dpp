import { Get, Param } from "@nestjs/common";

import { Pagination } from "../domain/pagination";
import { PagingResult } from "../domain/paging-result";
import { EnvironmentService } from "./environment.service";

export class AasController {
  constructor(private readonly environmentService: EnvironmentService) {}

  @Get("/:id/shells")
  async getShells(@Param("orgaId") organizationId: string, @Param("id") id: string): Promise<any> {
    const pagination = Pagination.create({ limit: 1 });
    const shells = await this.environmentService.getAasShells(organizationId, id, pagination);
    return PagingResult.create({ pagination, items: shells }).toPlain();
  }
}
