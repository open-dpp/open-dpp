import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ValueError } from "@open-dpp/exception";
import { AasExportable } from "../../../aas/domain/exportable/aas-exportable";
import {
  DigitalProductPassportIdentifiableEnvironmentPopulateDecorator,
} from "../../../aas/presentation/digital-product-passport-identifiable-environment-populate-decorator";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { UniqueProductIdentifierService } from "../../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";
import {AssetKind} from "@open-dpp/dto";

@Injectable()
export class PassportService {
  private readonly logger = new Logger(PassportService.name);

  constructor(
    private readonly passportRepository: PassportRepository,
    private readonly environmentService: EnvironmentService,
    private readonly aasRepository: AasRepository,
    private readonly submodelRepository: SubmodelRepository,
    private readonly uniqueProductIdentifierService: UniqueProductIdentifierService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getExpandedProductPassport(passportId: string) {
    const passport = await this.passportRepository.findOne(passportId);
    if (!passport) {
      throw new NotFoundException(
        `Product passport with id ${passportId} not found`,
      );
    }

    if (!passport.environment) {
      this.logger.warn(
        `Passport ${passportId} has no environment; returning empty shells and submodels`,
      );
      return {
        ...passport.toPlain(),
        environment: {
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        },
      };
    }

    const extendEnvironmentDecorator = new DigitalProductPassportIdentifiableEnvironmentPopulateDecorator(passport, this.aasRepository, this.submodelRepository);
    await extendEnvironmentDecorator.populate({ assetAdministrationShells: true, submodels: true, ignoreMissing: true });
    return extendEnvironmentDecorator.toPlain();
    return AasExportable.createFromPassport(passport, expandedEnvironment);
  }

  async exportPassport(passportId: string) {
    const aasExportable = await this.getExpandedProductPassport(passportId);
    if (!aasExportable) {
      throw new NotFoundException(`Passport ${passportId} not found`);
    }
    return aasExportable;
  }

  async importPassport(data: ExpandedPassport): Promise<Passport> {
    const validationResult = ExpandedPassportSchema.safeParse(data);

    if (!validationResult.success) {
      throw new BadRequestException(
        `Invalid passport data: ${validationResult.error.message}`,
      );
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
        const key = ref.keys.find(
          k => k.type === "Submodel" || k.type === "GlobalReference",
        );

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
      templateId: data.templateId ?? undefined,
      environment: Environment.create({
        assetAdministrationShells: newShells.map(s => s.id),
        submodels: Array.from(oldIdToNewSubmodelMap.values()).map(s => s.id),
        conceptDescriptions: data.environment.conceptDescriptions ?? [],
      }),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });

    const upid = newPassport.createUniqueProductIdentifier();

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
        await this.uniqueProductIdentifierService.save(upid);
      });
    }

  private async loadEnvironment(
    passport: Passport,
  ): Promise<{ shells: AssetAdministrationShell[]; submodels: Submodel[] }> {
    const shellIds = passport.environment.assetAdministrationShells;
    const submodelIds = passport.environment.submodels;

    await this.environmentService.persistImportedEnvironment(
      shells,
      submodels,
      async (options) => { await this.passportRepository.save(entity, options); },
    );

    const shells: AssetAdministrationShell[] = [];
    for (const id of shellIds) {
      const shell = shellMap.get(id);
      if (shell) {
        shells.push(shell);
      }
      else {
        this.logger.warn(
          `AssetAdministrationShell with id ${id} not found for passport ${passport.id}`,
        );
      }
    }

    const submodels: Submodel[] = [];
    for (const id of submodelIds) {
      const submodel = submodelMap.get(id);
      if (submodel) {
        submodels.push(submodel);
      }
      else {
        this.logger.warn(
          `Submodel with id ${id} not found for passport ${passport.id}`,
        );
      }
    }

    return { shells, submodels };
  }
}
