import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { PresentationReferenceType } from "@open-dpp/dto";
import { Environment } from "../../../aas/domain/environment";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import {
  ConceptDescriptionDoc,
  ConceptDescriptionSchema,
} from "../../../aas/infrastructure/schemas/concept-description.schema";
import { createAasTestContext } from "../../../aas/presentation/aas.test.context";
import { BrandingRepository } from "../../../branding/infrastructure/branding.repository";
import { BrandingDoc, BrandingSchema } from "../../../branding/infrastructure/branding.schema";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { Passport } from "../../../passports/domain/passport";
import { PassportRepository } from "../../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../../passports/infrastructure/passport.schema";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../../presentation-configurations/infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { PresentationConfigurationsModule } from "../../../presentation-configurations/presentation-configurations.module";
import { Permalink } from "../../domain/permalink";
import { PermalinkRepository } from "../../infrastructure/permalink.repository";
import { PermalinkDoc, PermalinkSchema } from "../../infrastructure/permalink.schema";
import { PermalinkModule } from "../../permalink.module";
import { PermalinkApplicationService } from "./permalink.application.service";

describe("PermalinkApplicationService.ensureDefaultForPassport", () => {
  const ctx = createAasTestContext(
    "/p",
    {
      imports: [PermalinkModule, PresentationConfigurationsModule],
      providers: [
        PermalinkRepository,
        PermalinkApplicationService,
        PassportRepository,
        BrandingRepository,
        PresentationConfigurationRepository,
      ],
    },
    [
      { name: PassportDoc.name, schema: PassportSchema },
      { name: BrandingDoc.name, schema: BrandingSchema },
      { name: PermalinkDoc.name, schema: PermalinkSchema },
      { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
    ],
    PermalinkRepository,
    SubjectAttributes.create({ userRole: UserRole.USER }),
  );

  async function seedPassport() {
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: randomUUID(),
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      }),
    });
    await ctx.getModuleRef().get(PassportRepository).save(passport);
    return passport;
  }

  it("creates both config and permalink when neither exists", async () => {
    const passport = await seedPassport();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const permalink = await service.ensureDefaultForPassport(passport);

    expect(permalink).toBeDefined();
    expect(permalink.id).toBeDefined();

    const config = await ctx
      .getModuleRef()
      .get(PresentationConfigurationRepository)
      .findByReference({
        referenceType: PresentationReferenceType.Passport,
        referenceId: passport.id,
      });
    expect(config).toBeDefined();
    expect(config!.id).toEqual(permalink.presentationConfigurationId);

    const persistedPermalink = await ctx
      .getModuleRef()
      .get(PermalinkRepository)
      .findByPresentationConfigurationId(config!.id);
    expect(persistedPermalink).toBeDefined();
    expect(persistedPermalink!.id).toEqual(permalink.id);
  });

  it("creates only the permalink when the config already exists", async () => {
    const passport = await seedPassport();
    const existingConfig = PresentationConfiguration.createForPassport({
      organizationId: passport.organizationId,
      referenceId: passport.id,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(existingConfig);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const permalink = await service.ensureDefaultForPassport(passport);

    expect(permalink.presentationConfigurationId).toEqual(existingConfig.id);

    const configs = await ctx
      .getModuleRef()
      .get(PresentationConfigurationRepository)
      .findManyByReference({
        referenceType: PresentationReferenceType.Passport,
        referenceId: passport.id,
      });
    expect(configs).toHaveLength(1);
    expect(configs[0].id).toEqual(existingConfig.id);
  });

  it("returns the existing permalink when both rows already exist (idempotent)", async () => {
    const passport = await seedPassport();
    const existingConfig = PresentationConfiguration.createForPassport({
      organizationId: passport.organizationId,
      referenceId: passport.id,
    });
    const existingPermalink = Permalink.create({
      presentationConfigurationId: existingConfig.id,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(existingConfig);
    await ctx.getModuleRef().get(PermalinkRepository).save(existingPermalink);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.ensureDefaultForPassport(passport);

    expect(result.id).toEqual(existingPermalink.id);

    const allPermalinks = await ctx
      .getModuleRef()
      .get(PermalinkRepository)
      .findAllByPassportId(passport.id);
    expect(allPermalinks).toHaveLength(1);
    expect(allPermalinks[0].id).toEqual(existingPermalink.id);
  });
});
