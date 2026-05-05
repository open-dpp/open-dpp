import { Injectable, NotFoundException } from "@nestjs/common";
import { PermalinkMetadataDtoSchema, PresentationReferenceType } from "@open-dpp/dto";
import { z } from "zod/v4";
import { DbSessionOptions } from "../../../database/query-options";
import { Passport } from "../../../passports/domain/passport";
import { PassportRepository } from "../../../passports/infrastructure/passport.repository";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { Permalink } from "../../domain/permalink";
import { PermalinkRepository } from "../../infrastructure/permalink.repository";

@Injectable()
export class PermalinkApplicationService {
  constructor(
    private readonly permalinkRepository: PermalinkRepository,
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
    private readonly passportRepository: PassportRepository,
  ) {}

  async resolvePermalink(idOrSlug: string): Promise<Permalink> {
    if (z.uuid().safeParse(idOrSlug).success) {
      return await this.permalinkRepository.findOneOrFail(idOrSlug);
    }
    return await this.permalinkRepository.findBySlugOrFail(idOrSlug);
  }

  async resolveToPassport(idOrSlug: string): Promise<{
    permalink: Permalink;
    presentationConfiguration: PresentationConfiguration;
    passport: Passport;
  }> {
    const permalink = await this.resolvePermalink(idOrSlug);
    const presentationConfiguration = await this.presentationConfigurationRepository.findOneOrFail(
      permalink.presentationConfigurationId,
    );
    if (presentationConfiguration.referenceType !== PresentationReferenceType.Passport) {
      throw new NotFoundException(`Permalink ${permalink.id} does not target a passport`);
    }
    const passport = await this.passportRepository.findOneOrFail(
      presentationConfiguration.referenceId,
    );
    return { permalink, presentationConfiguration, passport };
  }

  async getMetadataByPermalink(idOrSlug: string) {
    const { passport } = await this.resolveToPassport(idOrSlug);
    return PermalinkMetadataDtoSchema.parse({
      organizationId: passport.organizationId,
      passportId: passport.id,
      templateId: passport.templateId,
    });
  }

  async ensurePermalinkForPassport(
    passport: Passport,
    options?: DbSessionOptions,
  ): Promise<Permalink> {
    // Three callers reach this path:
    //   - Passport create from a template: the template's configs were
    //     snapshotted into the new passport just before this call, so
    //     findByReference returns the first snapshot config.
    //   - Passport create without a template: no config row exists; we
    //     create a fresh default here.
    //   - Passport import: the importer pre-saved a config row carrying the
    //     imported elementDesign/defaultComponents — reuse it.
    // findByReference returns the first by createdAt (deterministic), so
    // multi-config passports always permalink to the same canonical row.
    // Server-generated passport ids prevent two creators from racing on the
    // same referenceId, so this needs no retry.
    const existingConfig = await this.presentationConfigurationRepository.findByReference(
      {
        referenceType: PresentationReferenceType.Passport,
        referenceId: passport.id,
      },
      options,
    );
    const config =
      existingConfig ??
      (await this.presentationConfigurationRepository.save(
        PresentationConfiguration.createForPassport({
          organizationId: passport.organizationId,
          referenceId: passport.id,
        }),
        options,
      ));
    const permalink = Permalink.create({ presentationConfigurationId: config.id });
    return await this.permalinkRepository.save(permalink, options);
  }
}
