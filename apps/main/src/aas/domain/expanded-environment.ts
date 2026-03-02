import { ValueError } from "@open-dpp/exception";
import { z, ZodError } from "zod";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { Environment } from "./environment";
import { Submodel } from "./submodel-base/submodel";

const ExpandedEnvironmentSchema = z.object({
  assetAdministrationShells: z.array(z.record(z.string(), z.any())),
  submodels: z.array(z.record(z.string(), z.any())),
  conceptDescriptions: z.array(z.string()).optional(),
});

export interface ExpandedEnvironmentPlain {
  assetAdministrationShells: Record<string, any>[];
  submodels: Record<string, any>[];
  conceptDescriptions: string[];
}

export interface CopiedEnvironment {
  environment: Environment;
  shells: AssetAdministrationShell[];
  submodels: Submodel[];
}

export class ExpandedEnvironment {
  private constructor(
    public readonly shells: AssetAdministrationShell[],
    public readonly submodels: Submodel[],
    public readonly conceptDescriptions: string[],
  ) {}

  static empty(): ExpandedEnvironment {
    return new ExpandedEnvironment([], [], []);
  }

  static fromLoaded(
    shells: AssetAdministrationShell[],
    submodels: Submodel[],
    conceptDescriptions: string[],
  ): ExpandedEnvironment {
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

    return new ExpandedEnvironment(shells, submodels, parsed.conceptDescriptions ?? []);
  }

  toPlain(): ExpandedEnvironmentPlain {
    return {
      assetAdministrationShells: this.shells.map(shell => shell.toPlain()),
      submodels: this.submodels.map(submodel => submodel.toPlain()),
      conceptDescriptions: this.conceptDescriptions,
    };
  }

  toEnvironment(): Environment {
    return Environment.create({
      assetAdministrationShells: this.shells.map(s => s.id),
      submodels: this.submodels.map(s => s.id),
      conceptDescriptions: this.conceptDescriptions,
    });
  }

  /**
   * Copies all shells and submodels with fresh IDs, remapping submodel
   * references inside shells to point to the new submodel IDs.
   */
  copyWithNewIds(): CopiedEnvironment {
    const oldIdToNewSubmodel = new Map<string, Submodel>();
    for (const submodel of this.submodels) {
      oldIdToNewSubmodel.set(submodel.id, submodel.copy());
    }

    const newShells: AssetAdministrationShell[] = [];
    for (const shell of this.shells) {
      const relatedNewSubmodels = this.resolveSubmodelReferences(shell, oldIdToNewSubmodel);
      newShells.push(shell.copy(relatedNewSubmodels));
    }

    const newSubmodels = Array.from(oldIdToNewSubmodel.values());

    return {
      environment: Environment.create({
        assetAdministrationShells: newShells.map(s => s.id),
        submodels: newSubmodels.map(s => s.id),
        conceptDescriptions: this.conceptDescriptions,
      }),
      shells: newShells,
      submodels: newSubmodels,
    };
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
