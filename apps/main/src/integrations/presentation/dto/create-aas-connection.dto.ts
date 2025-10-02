import { z } from 'zod'
import { AssetAdministrationShellType } from '../../domain/asset-administration-shell'
import { AasFieldAssignmentSchema } from './aas-connection.dto'

export const CreateAasConnectionSchema = z.object({
  name: z.string(),
  aasType: z.enum(AssetAdministrationShellType),
  dataModelId: z.uuid(),
  modelId: z.uuid().nullable(),
  fieldAssignments: AasFieldAssignmentSchema.array(),
})

export type CreateAasConnectionDto = z.infer<typeof CreateAasConnectionSchema>
