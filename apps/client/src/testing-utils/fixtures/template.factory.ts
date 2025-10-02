import type { TemplateDto } from "@open-dpp/api-client";
import { Factory } from "fishery";
import { sectionFactory } from "./section.factory";

export const templateFactory = Factory.define<TemplateDto>(({ sequence }) => ({
  id: `product-data-model-${sequence}`,
  name: "Test Product Data Model",
  version: "1.0.0",
  createdByUserId: "userId",
  ownedByOrganizationId: "orgaId",
  sections: sectionFactory.buildList(2),
}));
