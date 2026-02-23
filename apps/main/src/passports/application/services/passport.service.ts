import type { Connection } from "mongoose";
import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { z } from "zod";
import { AssetAdministrationShell } from "../../../aas/domain/asset-adminstration-shell";
import { Environment } from "../../../aas/domain/environment";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { AasRepository } from "../../../aas/infrastructure/aas.repository";
import { SubmodelRepository } from "../../../aas/infrastructure/submodel.repository";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";

export type ExpandedPassport = Omit<ReturnType<Passport["toPlain"]>, "environment"> & {
  environment: {
    assetAdministrationShells: Record<string, any>[];
    submodels: Record<string, any>[];
    conceptDescriptions: string[];
  };
};

const ExpandedPassportSchema = z.object({
  organizationId: z.string().min(1, "organizationId is required"),
  environment: z.object({
    assetAdministrationShells: z.array(z.record(z.string(), z.any())),
    submodels: z.array(z.record(z.string(), z.any())),
    conceptDescriptions: z.array(z.string()).optional(),
  }),
}).passthrough();

@Injectable()
export class PassportService {
  private readonly logger = new Logger(PassportService.name);

  constructor(
    private readonly passportRepository: PassportRepository,
    private readonly environmentService: EnvironmentService,
    private readonly aasRepository: AasRepository,
    private readonly submodelRepository: SubmodelRepository,
    @InjectConnection() private readonly connection: Connection,
  ) { }

  async getProductPassport(passportId: string) {
    this.logger.log(`getProductPassport called with id: ${passportId}`);

    const passport = await this.passportRepository.findOne(passportId);
    if (!passport) {
      throw new NotFoundException(`Product passport with id ${passportId} not found`);
    }

    if (!passport.environment) {
      this.logger.warn(`Passport ${passportId} has no environment; returning empty shells and submodels`);
      return {
        ...passport.toPlain(),
        environment: {
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        },
      };
    }

    const environmentPlain = await this.environmentService.getFullEnvironmentAsPlain(passport.environment);

    return {
      ...passport.toPlain(),
      environment: environmentPlain,
    };
  }

  async exportPassport(passportId: string): Promise<ExpandedPassport> {
    const passport = await this.passportRepository.findOneOrFail(passportId);
    const { shells, submodels } = await this.loadEnvironment(passport);

    return {
      ...passport.toPlain(),
      environment: {
        assetAdministrationShells: shells.map(shell => shell.toPlain()),
        submodels: submodels.map(submodel => submodel.toPlain()),
        conceptDescriptions: passport.environment?.conceptDescriptions ?? [],
      },
    } as ExpandedPassport;
  }

  async importPassport(data: ExpandedPassport): Promise<Passport> {
    const validationResult = ExpandedPassportSchema.safeParse(data);

    if (!validationResult.success) {
      throw new BadRequestException(`Invalid passport data: ${validationResult.error.message}`);
    }

    // Re-doing the map logic with ID tracking
    const oldIdToNewSubmodelMap = new Map<string, Submodel>();
    data.environment.submodels.forEach((submodelData, index) => {
      const oldId = submodelData.id;
      if (!oldId || typeof oldId !== "string") {
        this.logger.warn(
          `Skipping submodel at index ${index} during import: missing or invalid id (got ${JSON.stringify(oldId)}). `
          + `Available fields: idShort=${JSON.stringify(submodelData.idShort)}, modelType=${JSON.stringify(submodelData.modelType)}`,
        );
        return;
      }

      const newSubmodel = Submodel.fromPlain(submodelData).copy();
      oldIdToNewSubmodelMap.set(oldId, newSubmodel);
    });

    // Build shells and remap submodel references (no DB operations yet)
    const newShells: AssetAdministrationShell[] = [];
    for (const shellData of data.environment.assetAdministrationShells) {
      const oldShell = AssetAdministrationShell.fromPlain(shellData);

      const relatedNewSubmodels: Submodel[] = [];
      for (const ref of oldShell.submodels) {
        const key = ref.keys.find(k => k.type === "Submodel" || k.type === "GlobalReference");

        if (!key) {
          if (ref.keys.length > 0) {
            this.logger.warn(
              `Reference key in shell ${oldShell.id} has unexpected type. Keys: ${JSON.stringify(ref.keys)}`,
            );
          }
          continue;
        }

        const newSub = oldIdToNewSubmodelMap.get(key.value);
        if (newSub) {
          relatedNewSubmodels.push(newSub);
        }
        else {
          this.logger.warn(
            `Submodel reference key ${key.value} not found in import map for shell ${oldShell.id}. Ref: ${JSON.stringify(
              ref,
            )}`,
          );
        }
      }

      newShells.push(oldShell.copy(relatedNewSubmodels));
    }

    const newPassport = Passport.create({
      organizationId: data.organizationId,
      templateId: data.templateId || undefined,
      environment: Environment.create({
        assetAdministrationShells: newShells.map(s => s.id),
        submodels: Array.from(oldIdToNewSubmodelMap.values()).map(s => s.id),
        conceptDescriptions: data.environment.conceptDescriptions ?? [],
      }),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });

    // Persist all entities in a single transaction to avoid partial commits
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        for (const submodel of Array.from(oldIdToNewSubmodelMap.values())) {
          await this.submodelRepository.save(submodel, { session });
        }
        for (const shell of newShells) {
          await this.aasRepository.save(shell, { session });
        }
        await this.passportRepository.save(newPassport, { session });
      });
    }
    finally {
      await session.endSession();
    }

    return newPassport;
  }

  private async loadEnvironment(passport: Passport): Promise<{ shells: AssetAdministrationShell[]; submodels: Submodel[] }> {
    const shellIds = passport.environment.assetAdministrationShells;
    const submodelIds = passport.environment.submodels;

    const [shellMap, submodelMap] = await Promise.all([
      this.aasRepository.findByIds(shellIds),
      this.submodelRepository.findByIds(submodelIds),
    ]);

    const shells: AssetAdministrationShell[] = [];
    for (const id of shellIds) {
      const shell = shellMap.get(id);
      if (shell) {
        shells.push(shell);
      }
      else {
        this.logger.warn(`AssetAdministrationShell with id ${id} not found for passport ${passport.id}`);
      }
    }

    const submodels: Submodel[] = [];
    for (const id of submodelIds) {
      const submodel = submodelMap.get(id);
      if (submodel) {
        submodels.push(submodel);
      }
      else {
        this.logger.warn(`Submodel with id ${id} not found for passport ${passport.id}`);
      }
    }

    return { shells, submodels };
  }
}
