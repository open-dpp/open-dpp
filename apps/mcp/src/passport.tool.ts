import { Injectable, Logger } from "@nestjs/common";
import { Tool } from "@rekog/mcp-nest";
import { z } from "zod";
import { DppService } from "./dpp.service";

@Injectable()
export class PassportTool {
  private readonly logger: Logger = new Logger(PassportTool.name);
  private readonly dppService: DppService;

  constructor(dppService: DppService) {
    this.dppService = dppService;
    this.logger.log(`Starting passport tool`);
  }

  @Tool({
    name: "product-passport-tool",
    description: "Returns a product passport",
    parameters: z.object({
      passportId: z
        .string()
        .regex(
          /<([^>]+)>/,
          "Must be a valid id",
        )
        .transform((val) => {
          // Extract the content between < and >
          const match = val.match(/<([^>]+)>/);
          return match ? match[1] : val;
        })
        .describe(
          "Exact id of the product passport, e.g. '<123e4567-e89b-12d3-a456-426614174000>'. Do not make one up.",
        ),
    }),
  })
  async getProductPassport({ passportId }: { passportId: string }) {
    this.logger.log(`product-passport-tool is called with id: ${passportId}`);

    return await this.dppService.getProductPassport(passportId);
  }
}
