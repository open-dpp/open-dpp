import { Factory } from "fishery";
import { AiConfigurationDto, AiProvider } from "@open-dpp/api-client";

import { v4 as uuid4 } from "uuid";

const nowDate = new Date("2025-01-01T12:00:00Z");
export const aiConfigurationFactory = Factory.define<AiConfigurationDto>(
  () => ({
    id: uuid4(),
    ownedByOrganizationId: uuid4(),
    createdByUserId: uuid4(),
    createdAt: nowDate.toISOString(),
    updatedAt: nowDate.toISOString(),
    provider: AiProvider.Mistral,
    model: "codestral-latest",
    isEnabled: true,
  }),
);
