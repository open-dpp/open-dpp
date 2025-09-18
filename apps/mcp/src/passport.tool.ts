// greeting.tool.ts
import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DppService } from './dpp.service';

@Injectable()
export class PassportTool {
  private readonly logger: Logger = new Logger(PassportTool.name);

  constructor(private readonly dppService: DppService) {}
  @Tool({
    name: 'product-passport-tool',
    description: 'Returns a product passport',
    parameters: z.object({
      uuid: z
        .string()
        .regex(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
          'Must be a valid UUID v4',
        )
        .describe(
          "Exact UUID v4 of the product passport, e.g. '123e4567-e89b-12d3-a456-426614174000'. Do not make one up.",
        ),
    }),
  })
  async getProductPassport({ uuid }) {
    this.logger.log(`product-passport-tool is called with uuid: ${uuid}`);

    return await this.dppService.getProductPassport(uuid);
  }
}
