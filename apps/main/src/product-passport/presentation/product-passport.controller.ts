import { Controller, Get, Param } from "@nestjs/common";
import { AllowAnonymous } from "../../auth/allow-anonymous.decorator";
import { ItemsService } from "../../items/infrastructure/items.service";
import { ModelsService } from "../../models/infrastructure/models.service";
import { TemplateService } from "../../templates/infrastructure/template.service";
import { UniqueProductIdentifierService } from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { ProductPassport } from "../domain/product-passport";
import { productPassportToDto } from "./dto/product-passport.dto";

@Controller()
export class ProductPassportController {
  private readonly modelsService: ModelsService;
  private readonly uniqueProductIdentifierService: UniqueProductIdentifierService;
  private readonly templateService: TemplateService;
  private readonly itemService: ItemsService;

  constructor(
    modelsService: ModelsService,
    uniqueProductIdentifierService: UniqueProductIdentifierService,
    templateService: TemplateService,
    itemService: ItemsService,
  ) {
    this.modelsService = modelsService;
    this.uniqueProductIdentifierService = uniqueProductIdentifierService;
    this.templateService = templateService;
    this.itemService = itemService;
  }

  @AllowAnonymous()
  @Get("product-passports/:id")
  async getProductPassport(@Param("id") id: string) {
    const uniqueProductIdentifier
      = await this.uniqueProductIdentifierService.findOneOrFail(id);
    const item = await this.itemService.findOne(
      uniqueProductIdentifier.referenceId,
    );
    const modelId = item?.modelId ?? uniqueProductIdentifier.referenceId;
    const model = await this.modelsService.findOneOrFail(modelId);

    const template = await this.templateService.findOneOrFail(model.templateId);

    const productPassport = ProductPassport.create({
      uniqueProductIdentifier,
      template,
      model,
      item,
    });

    return productPassportToDto(productPassport);
  }
}
