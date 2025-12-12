import { z } from "zod";

export const EnvironmentDbSchema = z.object({
  assetAdministrationShells: z.string().array(),
  submodels: z.string().array(),
  conceptDescriptions: z.string().array(),
});
