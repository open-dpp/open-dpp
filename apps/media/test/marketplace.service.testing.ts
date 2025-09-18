import { Sector } from '@open-dpp/api-client';
import { Injectable } from '@nestjs/common';
import { Template } from '../../main/src/templates/domain/template';

@Injectable()
export class MarketplaceServiceTesting {
  private readonly templateMap = new Map<string, Template>();
  constructor() {}

  async upload(
    template: Template,
    sectors: Sector[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: string,
  ) {
    const marketplaceResourceId = `templateFor${template.id}`;

    this.templateMap.set(marketplaceResourceId, template);
    return {
      id: marketplaceResourceId,
      sectors,
    };
  }

  async download(
    organizationId: string,

    userId: string,
    marketplaceResourceId: string,
  ): Promise<Template> {
    const template = this.templateMap.get(marketplaceResourceId);
    if (!template) {
      throw new Error(
        `Template with marketplaceResourceId ${marketplaceResourceId} not found`,
      );
    }
    template.assignMarketplaceResource(marketplaceResourceId);
    return template;
  }
}
