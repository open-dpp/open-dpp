import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Tool } from "@rekog/mcp-nest";
import { z } from "zod";
import { AuthService } from "../auth/auth.service";
import { ItemsService } from "../items/infrastructure/items.service";
import { ModelsService } from "../models/infrastructure/models.service";
import { TemplateService } from "../old-templates/infrastructure/template.service";
import { ProductPassport } from "../product-passport/domain/product-passport";
import { productPassportToDto } from "../product-passport/presentation/dto/product-passport.dto";
import {
  UniqueProductIdentifierService,
} from "../unique-product-identifier/infrastructure/unique-product-identifier.service";

@Injectable()
export class PassportTool {
  private readonly logger: Logger = new Logger(PassportTool.name);
  private readonly modelsService: ModelsService;
  private readonly uniqueProductIdentifierService: UniqueProductIdentifierService;
  private readonly templateService: TemplateService;
  private readonly itemService: ItemsService;
  private readonly authService: AuthService;

  constructor(
    modelsService: ModelsService,
    uniqueProductIdentifierService: UniqueProductIdentifierService,
    templateService: TemplateService,
    itemService: ItemsService,
    authService: AuthService,
  ) {
    this.modelsService = modelsService;
    this.uniqueProductIdentifierService = uniqueProductIdentifierService;
    this.templateService = templateService;
    this.itemService = itemService;
    this.authService = authService;
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

    const uniqueProductIdentifier
      = await this.uniqueProductIdentifierService.findOneOrFail(passportId);
    const item = await this.itemService.findOne(
      uniqueProductIdentifier.referenceId,
    );
    const modelId = item?.modelId ?? uniqueProductIdentifier.referenceId;
    const model = await this.modelsService.findOneOrFail(modelId);

    const template = await this.templateService.findOneOrFail(model.templateId);

    const organizationData = await this.authService.getOrganizationDataForPermalink(model.ownedByOrganizationId);
    if (!organizationData) {
      throw new NotFoundException("No organization data found.");
    }

    const productPassport = ProductPassport.create({
      uniqueProductIdentifier,
      template,
      model,
      item,
      organizationName: organizationData.name,
      organizationImage: organizationData.image,
    });

    return productPassportToDto(productPassport);
  }
}
