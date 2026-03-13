import { ValueError } from "@open-dpp/exception";
import { z, ZodError } from "zod";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { ConceptDescription } from "./concept-description";
import { Environment } from "./environment";
import { Submodel } from "./submodel-base/submodel";

const ExpandedEnvironmentSchema = z.object({
  assetAdministrationShells: z.array(z.record(z.string(), z.any())),
  submodels: z.array(z.record(z.string(), z.any())),
  conceptDescriptions: z.array(z.record(z.string(), z.any())).optional(),
});

export interface ExpandedEnvironmentPlain {
  assetAdministrationShells: Record<string, any>[];
  submodels: Record<string, any>[];
  conceptDescriptions: Record<string, any>[];
}

export interface CopiedEnvironment {
  environment: Environment;
  shells: AssetAdministrationShell[];
  submodels: Submodel[];
  conceptDescriptions: ConceptDescription[];
}

export class ExpandedEnvironment {
  private constructor(
    public readonly shells: AssetAdministrationShell[],
    public readonly submodels: Submodel[],
    public readonly conceptDescriptions: ConceptDescription[],
  ) {}

  static empty(): ExpandedEnvironment {
    return new ExpandedEnvironment([], [], []);
  }

  static fromLoaded(
    shells: AssetAdministrationShell[],
    submodels: Submodel[],
    conceptDescriptions: ConceptDescription[],
  ): ExpandedEnvironment {
    return new ExpandedEnvironment(shells, submodels, conceptDescriptions);
  }

  /**
   * Resolves an ID-only Environment into a fully hydrated ExpandedEnvironment,
   * validating that all referenced IDs exist in the provided maps.
   * Throws ValueError if any referenced entities are missing.
   */
  static fromEnvironment(
    environment: Environment,
    shellMap: Map<string, AssetAdministrationShell>,
    submodelMap: Map<string, Submodel>,
    conceptDescriptionMap: Map<string, ConceptDescription>,
  ): ExpandedEnvironment {
    const missingShellIds = environment.assetAdministrationShells.filter(id => !shellMap.has(id));
    const missingSubmodelIds = environment.submodels.filter(id => !submodelMap.has(id));
    const missingConceptDescriptionIds = environment.conceptDescriptions.filter(id => !conceptDescriptionMap.has(id));

    if (missingShellIds.length > 0 || missingSubmodelIds.length > 0 || missingConceptDescriptionIds.length > 0) {
      throw new ValueError(
        `Environment references entities missing from the database. `
        + `Missing shells: [${missingShellIds.join(", ")}], `
        + `missing submodels: [${missingSubmodelIds.join(", ")}], `
        + `missing concept descriptions: [${missingConceptDescriptionIds.join(", ")}]`,
      );
    }

    const shells = environment.assetAdministrationShells.map(id => shellMap.get(id)!);
    const submodels = environment.submodels.map(id => submodelMap.get(id)!);
    const conceptDescriptions = environment.conceptDescriptions.map(id => conceptDescriptionMap.get(id)!);

    return new ExpandedEnvironment(shells, submodels, conceptDescriptions);
  }

  /**
   * Validates and reconstructs domain objects from expanded plain data.
   * Wraps ZodError into ValueError for domain-friendly error reporting.
   */
  static fromPlain(data: unknown): ExpandedEnvironment {
    let parsed: z.infer<typeof ExpandedEnvironmentSchema>;
    try {
      parsed = ExpandedEnvironmentSchema.parse(data);
    }
    catch (err) {
      if (err instanceof ZodError) {
        throw new ValueError(`Invalid environment data: ${err.message}`);
      }
      throw err;
    }

    const submodels: Submodel[] = [];
    for (let index = 0; index < parsed.submodels.length; index++) {
      const submodelData = parsed.submodels[index];
      const oldId = submodelData.id;
      if (!oldId || typeof oldId !== "string") {
        throw new ValueError(
          `Submodel at index ${index} has a missing or invalid id`,
        );
      }

      try {
        submodels.push(Submodel.fromPlain(submodelData));
      }
      catch (err) {
        if (err instanceof ZodError) {
          throw new ValueError(`Invalid submodel at index ${index}: ${err.message}`);
        }
        throw err;
      }
    }

    const shells: AssetAdministrationShell[] = [];
    for (let index = 0; index < parsed.assetAdministrationShells.length; index++) {
      const shellData = parsed.assetAdministrationShells[index];
      try {
        shells.push(AssetAdministrationShell.fromPlain(shellData));
      }
      catch (err) {
        if (err instanceof ZodError) {
          throw new ValueError(`Invalid assetAdministrationShell at index ${index}: ${err.message}`);
        }
        throw err;
      }
    }

    const conceptDescriptions: ConceptDescription[] = [];
    for (let index = 0; index < (parsed.conceptDescriptions ?? []).length; index++) {
      const cdData = parsed.conceptDescriptions![index];
      try {
        conceptDescriptions.push(ConceptDescription.fromPlain(cdData));
      }
      catch (err) {
        if (err instanceof ZodError) {
          throw new ValueError(`Invalid conceptDescription at index ${index}: ${err.message}`);
        }
        throw err;
      }
    }

    return new ExpandedEnvironment(shells, submodels, conceptDescriptions);
  }

  toPlain(): ExpandedEnvironmentPlain {
    return {
      assetAdministrationShells: this.shells.map(shell => shell.toPlain()),
      submodels: this.submodels.map(submodel => submodel.toPlain()),
      conceptDescriptions: this.conceptDescriptions.map(cd => cd.toPlain()),
    };
  }

  toEnvironment(): Environment {
    return Environment.create({
      assetAdministrationShells: this.shells.map(s => s.id),
      submodels: this.submodels.map(s => s.id),
      conceptDescriptions: this.conceptDescriptions.map(cd => cd.id),
    });
  }

  private resolveSubmodelReferences(
    shell: AssetAdministrationShell,
    idMap: Map<string, Submodel>,
  ): Submodel[] {
    const resolved: Submodel[] = [];

    for (const ref of shell.submodels) {
      const key = ref.keys.find(k => k.type === "Submodel" || k.type === "GlobalReference");
      if (!key) {
        continue;
      }

      const newSub = idMap.get(key.value);
      if (newSub) {
        resolved.push(newSub);
      }
    }

    return resolved;
  }
}
