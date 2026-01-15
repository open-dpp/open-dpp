import { z } from "zod";

export const AdministrativeInformationDbSchema = z.object({
  version: z.string(),
  revision: z.string(),
});
