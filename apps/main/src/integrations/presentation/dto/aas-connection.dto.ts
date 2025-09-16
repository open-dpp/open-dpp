import { z } from 'zod';
import { AssetAdministrationShellType } from '../../domain/asset-administration-shell';

export const AasFieldAssignmentSchema = z.object({
  dataFieldId: z.uuid(),
  sectionId: z.uuid(),
  idShortParent: z.string(),
  idShort: z.string(),
});

export const AasConnectionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  dataModelId: z.uuid(),
  aasType: z.enum(AssetAdministrationShellType),
  modelId: z.uuid().nullable(),
  fieldAssignments: AasFieldAssignmentSchema.array(),
});

export type AasConnectionDto = z.infer<typeof AasConnectionSchema>;

export function aasConnectionToDto(
  aasMapping: AasConnectionDto,
): AasConnectionDto {
  return AasConnectionSchema.parse({
    id: aasMapping.id,
    name: aasMapping.name,
    dataModelId: aasMapping.dataModelId,
    aasType: aasMapping.aasType,
    modelId: aasMapping.modelId,
    fieldAssignments: aasMapping.fieldAssignments.map((fieldAssignment) => ({
      dataFieldId: fieldAssignment.dataFieldId,
      sectionId: fieldAssignment.sectionId,
      idShort: fieldAssignment.idShort,
      idShortParent: fieldAssignment.idShortParent,
    })),
  });
}
