import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { z } from "zod";
import { AssetAdministrationShell } from "../../../aas/domain/asset-adminstration-shell";
import { Environment } from "../../../aas/domain/environment";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { AasRepository } from "../../../aas/infrastructure/aas.repository";
import { SubmodelRepository } from "../../../aas/infrastructure/submodel.repository";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";

@Injectable()
export class PassportService {
  private readonly logger = new Logger(PassportService.name);

  constructor(
    private readonly passportRepository: PassportRepository,
    // private readonly organizationsService: OrganizationsService,
    private readonly aasRepository: AasRepository,
    private readonly submodelRepository: SubmodelRepository,
  ) { }

  // TODO: Add organization data after DDD rebuild branch merged
  async getProductPassport(passportId: string) {
    this.logger.log(`getProductPassport called with id: ${passportId}`);

    const passport = await this.passportRepository.findOne(passportId);
    if (!passport) {
      throw new NotFoundException(`Product passport with id ${passportId} not found`);
    }

    /* const organizationData = await this.organizationsService.getOrganizationDataForPermalink(passport.organizationId);

    if (!organizationData) {
      throw new NotFoundException(`Organization data for passport ${passportId} not found`);
    } */

    const shells: Array<AssetAdministrationShell> = [];
    for (const shellId of passport.environment.assetAdministrationShells) {
      const aas = await this.aasRepository.findOne(shellId);
      if (aas) {
        shells.push(aas);
      }
    }

    const submodels: Array<Submodel> = [];
    for (const shellId of passport.environment.submodels) {
      const submodel = await this.submodelRepository.findOne(shellId);
      if (submodel) {
        submodels.push(submodel);
      }
    }

    return {
      // organization: organizationData,
      ...passport,
      environment: {
        assetAdministrationShells: shells,
        submodels,
      },
    };
  }

  async exportPassport(passportId: string): Promise<ExpandedPassport> {
    const passport = await this.passportRepository.findOneOrFail(passportId);
    const shells: Array<AssetAdministrationShell> = [];
    for (const shellId of passport.environment.assetAdministrationShells) {
      const aas = await this.aasRepository.findOne(shellId);
      if (aas) {
        shells.push(aas);
      }
    }

    const submodels: Array<Submodel> = [];
    for (const submodelId of passport.environment.submodels) {
      const submodel = await this.submodelRepository.findOne(submodelId);
      if (submodel) {
        submodels.push(submodel);
      }
    }

    return {
      ...passport.toPlain(),
      environment: {
        assetAdministrationShells: shells.map(shell => shell.toPlain()),
        submodels: submodels.map(submodel => submodel.toPlain()),
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
    data.environment.submodels.forEach((submodelData) => {
      // assume submodelData has the old ID
      const oldId = submodelData["id"];
      if (!oldId || typeof oldId !== "string") {
        return;
      }

      const newSubmodel = Submodel.fromPlain(submodelData).copy();
      oldIdToNewSubmodelMap.set(oldId, newSubmodel);
    });

    // Save submodels
    for (const submodel of oldIdToNewSubmodelMap.values()) {
      await this.submodelRepository.save(submodel);
    }

    const newShells: AssetAdministrationShell[] = [];
    for (const shellData of data.environment.assetAdministrationShells) {
      const oldShell = AssetAdministrationShell.fromPlain(shellData);

      // Find which new submodels correspond to the old shell's references
      const relatedNewSubmodels: Submodel[] = [];
      for (const ref of oldShell.submodels) {
        const key = ref.keys.find((k) => k.type === "Submodel" || k.type === "GlobalReference");

        if (!key) {
          if (ref.keys.length > 0) {
            this.logger.warn(
              `Reference key in shell ${oldShell.id} has unexpected type. Keys: ${JSON.stringify(ref.keys)}`
            );
          }
          continue;
        }

        const newSub = oldIdToNewSubmodelMap.get(key.value);
        if (newSub) {
          relatedNewSubmodels.push(newSub);
        } else {
          this.logger.warn(
            `Submodel reference key ${key.value} not found in import map for shell ${oldShell.id}. Ref: ${JSON.stringify(
              ref
            )}`
          );
        }
      }

      const newShell = oldShell.copy(relatedNewSubmodels);
      newShells.push(newShell);
      await this.aasRepository.save(newShell);
    }

    const newPassport = Passport.create({
      organizationId: data.organizationId,
      templateId: data.templateId || undefined,
      environment: Environment.create({
        assetAdministrationShells: newShells.map(s => s.id),
        submodels: Array.from(oldIdToNewSubmodelMap.values()).map(s => s.id),
      }),
    });

    await this.passportRepository.save(newPassport);

    return newPassport;
  }
}

export type ExpandedPassport = Omit<ReturnType<Passport["toPlain"]>, "environment"> & {
  environment: {
    assetAdministrationShells: Record<string, any>[];
    submodels: Record<string, any>[];
  };
};

const ExpandedPassportSchema = z.object({
  environment: z.object({
    assetAdministrationShells: z.array(z.record(z.string(), z.any())),
    submodels: z.array(z.record(z.string(), z.any())),
  }),
}).passthrough();
