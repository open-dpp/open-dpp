import type { PermalinkDtoSchema } from "@open-dpp/dto";
import type { z } from "zod";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";

interface PermalinkTransient {
  presentationConfigurationId?: string;
  slug?: string | null;
}

export const permalinksPlainFactory = Factory.define<
  z.infer<typeof PermalinkDtoSchema>,
  PermalinkTransient
>(({ transientParams }) => ({
  id: randomUUID(),
  slug: transientParams.slug ?? null,
  presentationConfigurationId: transientParams.presentationConfigurationId ?? randomUUID(),
  createdAt: new Date(Date.now()).toISOString(),
  updatedAt: new Date(Date.now()).toISOString(),
}));
