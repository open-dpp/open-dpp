import { Security } from "../../../domain/security/security";
import { AasExportVersion } from "./aas-export-shared";
import {
  AasExportLatestVersion,
  AasExportSchemas,
  aasExportSchemaJsonLatest,
} from "./aas-export-types";

export function ParseWithMigration(data: unknown): AasExportLatestVersion {
  let exportedAas = AasExportSchemas.parse(data);
  if (exportedAas.version === AasExportVersion.v1_0) {
    const security = Security.create({});
    exportedAas.environment.submodels.forEach((submodel) => {
      security.addDefaultPolicyForSubmodelIfNoExists(submodel);
    });

    exportedAas = AasExportSchemas.parse({
      ...exportedAas,
      createdAt: exportedAas.createdAt.toISOString(),
      updatedAt: exportedAas.updatedAt.toISOString(),
      version: AasExportVersion.v2_0,
      environment: {
        ...exportedAas.environment,
        assetAdministrationShells: [
          {
            ...exportedAas.environment.assetAdministrationShells[0],
            security: security.toPlain(),
          },
        ],
      },
    });
  }
  if (exportedAas.version === AasExportVersion.v2_0) {
    // Nothing to do
    exportedAas = AasExportSchemas.parse({
      ...exportedAas,
      createdAt: exportedAas.createdAt.toISOString(),
      updatedAt: exportedAas.updatedAt.toISOString(),
      version: AasExportVersion.v3_0,
    });
  }
  if (exportedAas.version === AasExportVersion.v3_0) {
    //Nothing to do
    exportedAas = AasExportSchemas.parse({
      ...exportedAas,
      createdAt: exportedAas.createdAt.toISOString(),
      updatedAt: exportedAas.updatedAt.toISOString(),
      version: AasExportVersion.v4_0,
    });
  }

  return aasExportSchemaJsonLatest.parse({
    ...exportedAas,
    createdAt: exportedAas.createdAt.toISOString(),
    updatedAt: exportedAas.updatedAt.toISOString(),
  });
}
