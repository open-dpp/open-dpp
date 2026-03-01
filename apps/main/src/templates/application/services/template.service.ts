import type { Connection } from "mongoose";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { z, ZodError } from "zod";
import { AssetAdministrationShell } from "../../../aas/domain/asset-adminstration-shell";
import { Environment } from "../../../aas/domain/environment";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { AasRepository } from "../../../aas/infrastructure/aas.repository";
import { SubmodelRepository } from "../../../aas/infrastructure/submodel.repository";
import { Template } from "../../domain/template";
import { TemplateRepository } from "../../infrastructure/template.repository";

export type ExpandedTemplate = Omit<ReturnType<Template["toPlain"]>, "environment"> & {
  environment: {
    assetAdministrationShells: Record<string, any>[];
    submodels: Record<string, any>[];
    conceptDescriptions: string[];
  };
};

const ExpandedTemplateSchema = z.object({
  organizationId: z.string().min(1, "organizationId is required"),
  environment: z.object({
    assetAdministrationShells: z.array(z.record(z.string(), z.any())),
    submodels: z.array(z.record(z.string(), z.any())),
    conceptDescriptions: z.array(z.string()).optional(),
  }),
}).passthrough();

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly aasRepository: AasRepository,
    private readonly submodelRepository: SubmodelRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async exportTemplate(templateId: string): Promise<ExpandedTemplate> {
    const template = await this.templateRepository.findOneOrFail(templateId);

    if (!template.environment) {
      return {
        ...template.toPlain(),
        environment: {
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        },
      } as ExpandedTemplate;
    }

    const { shells, submodels } = await this.loadEnvironment(template);

    return {
      ...template.toPlain(),
      environment: {
        assetAdministrationShells: shells.map(shell => shell.toPlain()),
        submodels: submodels.map(submodel => submodel.toPlain()),
        conceptDescriptions: template.environment.conceptDescriptions ?? [],
      },
    } as ExpandedTemplate;
  }

  async importTemplate(data: ExpandedTemplate & { organizationId: string }): Promise<Template> {
    const validationResult = ExpandedTemplateSchema.safeParse(data);

    if (!validationResult.success) {
      throw new BadRequestException(`Invalid template data: ${validationResult.error.message}`);
    }

    const oldIdToNewSubmodelMap = new Map<string, Submodel>();
    for (let index = 0; index < data.environment.submodels.length; index++) {
      const submodelData = data.environment.submodels[index];
      const oldId = submodelData.id;
      if (!oldId || typeof oldId !== "string") {
        this.logger.warn(
          `Skipping submodel at index ${index} during import: missing or invalid id (got ${JSON.stringify(oldId)}). `
          + `Available fields: idShort=${JSON.stringify(submodelData.idShort)}, modelType=${JSON.stringify(submodelData.modelType)}`,
        );
        continue;
      }

      try {
        const newSubmodel = Submodel.fromPlain(submodelData).copy();
        oldIdToNewSubmodelMap.set(oldId, newSubmodel);
      }
      catch (err) {
        if (err instanceof ZodError) {
          throw new BadRequestException(
            `Invalid submodel at index ${index}: ${err.message}`,
          );
        }
        throw err;
      }
    }

    const newShells: AssetAdministrationShell[] = [];
    for (let shellIndex = 0; shellIndex < data.environment.assetAdministrationShells.length; shellIndex++) {
      const shellData = data.environment.assetAdministrationShells[shellIndex];
      let oldShell: AssetAdministrationShell;
      try {
        oldShell = AssetAdministrationShell.fromPlain(shellData);
      }
      catch (err) {
        if (err instanceof ZodError) {
          throw new BadRequestException(
            `Invalid assetAdministrationShell at index ${shellIndex}: ${err.message}`,
          );
        }
        throw err;
      }

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

    const newTemplate = Template.create({
      organizationId: data.organizationId,
      environment: Environment.create({
        assetAdministrationShells: newShells.map(s => s.id),
        submodels: Array.from(oldIdToNewSubmodelMap.values()).map(s => s.id),
        conceptDescriptions: data.environment.conceptDescriptions ?? [],
      }),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        for (const submodel of Array.from(oldIdToNewSubmodelMap.values())) {
          await this.submodelRepository.save(submodel, { session });
        }
        for (const shell of newShells) {
          await this.aasRepository.save(shell, { session });
        }
        await this.templateRepository.save(newTemplate, { session });
      });
    }
    finally {
      await session.endSession();
    }

    return newTemplate;
  }

  private async loadEnvironment(template: Template): Promise<{ shells: AssetAdministrationShell[]; submodels: Submodel[] }> {
    const shellIds = template.environment.assetAdministrationShells;
    const submodelIds = template.environment.submodels;

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
        this.logger.warn(`AssetAdministrationShell with id ${id} not found for template ${template.id}`);
      }
    }

    const submodels: Submodel[] = [];
    for (const id of submodelIds) {
      const submodel = submodelMap.get(id);
      if (submodel) {
        submodels.push(submodel);
      }
      else {
        this.logger.warn(`Submodel with id ${id} not found for template ${template.id}`);
      }
    }

    return { shells, submodels };
  }
}
