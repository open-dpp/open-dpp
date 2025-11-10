import type { ModelDto } from "@open-dpp/api-client";
import { Factory } from "fishery";
import { v4 as uuid4 } from "uuid";

export const modelFactory = Factory.define<ModelDto>(() => {
  const id = uuid4();
  return {
    id,
    name: `Product Name ${id}`,
    description: "Product Description",
    mediaReferences: [],
    owner: "Owner 1",
    uniqueProductIdentifiers: [],
    templateId: "t1",
    dataValues: [],
  };
});
