import { z } from "zod";

export const EnvironmentJsonSchema = z.object({
  assetAdministrationShells: z.string().array(),
  submodels: z.string().array(),
  conceptDescriptions: z.string().array(),
});
