import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { OrganizationsService } from "../../identity/organizations/application/services/organizations.service";
import { Organization } from "../../identity/organizations/domain/organization";
import { Branding } from "../domain/branding";
import { BrandingRepository } from "./branding.repository";
import { BrandingDoc, BrandingSchema } from "./branding.schema";

describe("brandingRepository", () => {
  let brandingRepository: BrandingRepository;
  let organizationService: OrganizationsService;
  const organizationServiceMock = {
    getOrganization: jest.fn(),
  } as unknown as jest.Mocked<OrganizationsService>;

  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          {
            name: BrandingDoc.name,
            schema: BrandingSchema,
          },
        ]),
      ],
      providers: [
        {
          provide: OrganizationsService,
          useValue: organizationServiceMock,
        },
        BrandingRepository,
      ],
    }).compile();

    brandingRepository = module.get<BrandingRepository>(BrandingRepository);
    organizationService = module.get<OrganizationsService>(OrganizationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it("should save the organization branding", async () => {
    const orgId = randomUUID();
    const branding = Branding.create({
      organizationId: orgId,
      logo: "my-logo",
    });
    jest.spyOn(organizationService, "getOrganization").mockResolvedValue(
      Organization.create({
        name: "acme",
        slug: `acme-${randomUUID()}`,
      }),
    );

    await brandingRepository.save(branding);
    const foundBranding = await brandingRepository.findOneByOrganizationId(orgId);
    expect(foundBranding).toEqual(branding);
  });

  it("should return logo from organization to branding", async () => {
    const orgId = randomUUID();
    const logo = "logo-from-organization";

    jest.spyOn(organizationService, "getOrganization").mockResolvedValue(
      Organization.create({
        name: "acme",
        slug: `acme-${randomUUID()}`,
        logo,
      }),
    );

    const migratedBranding = await brandingRepository.findOneByOrganizationId(orgId);
    expect(organizationService.getOrganization).toHaveBeenCalledWith(orgId);
    expect(migratedBranding.organizationId).toBe(orgId);
    expect(migratedBranding.logo).toBe(logo);
  });

  describe("isOrganizationLogo", () => {
    it("returns true only when the media is the org's designated logo (no cross-org exposure)", async () => {
      const orgId = randomUUID();
      const otherOrgId = randomUUID();
      const logoMediaId = randomUUID();
      jest
        .spyOn(organizationService, "getOrganization")
        .mockResolvedValue(Organization.create({ name: "acme", slug: `acme-${randomUUID()}` }));
      await brandingRepository.save(Branding.create({ organizationId: orgId, logo: logoMediaId }));

      // owning org designated it as its logo → public
      expect(await brandingRepository.isOrganizationLogo(logoMediaId, orgId)).toBe(true);
      // another org's effective logo is not this media (no cross-org exposure)
      expect(await brandingRepository.isOrganizationLogo(logoMediaId, otherOrgId)).toBe(false);
      // a non-logo media id is never public
      expect(await brandingRepository.isOrganizationLogo(randomUUID(), orgId)).toBe(false);
    });

    it("resolves the legacy organization.logo fallback for orgs without a BrandingDoc", async () => {
      const orgId = randomUUID();
      const legacyLogo = randomUUID();
      jest
        .spyOn(organizationService, "getOrganization")
        .mockResolvedValue(
          Organization.create({ name: "acme", slug: `acme-${randomUUID()}`, logo: legacyLogo }),
        );

      // no BrandingDoc saved → must still recognize the org.logo fallback (regression guard)
      expect(await brandingRepository.isOrganizationLogo(legacyLogo, orgId)).toBe(true);
      expect(await brandingRepository.isOrganizationLogo(randomUUID(), orgId)).toBe(false);
    });
  });

  it("should migrate logo from organization on save", async () => {
    const orgId = randomUUID();
    const logo = "logo-from-organization";

    jest.spyOn(organizationService, "getOrganization").mockResolvedValue(
      Organization.create({
        name: "acme",
        slug: `acme-${randomUUID()}`,
        logo,
      }),
    );

    const migratedBranding = await brandingRepository.save(
      Branding.fromPlain(
        {
          primaryColor: "ffffff",
        },
        orgId,
      ),
    );
    expect(organizationService.getOrganization).toHaveBeenCalledWith(orgId);
    expect(migratedBranding.organizationId).toBe(orgId);
    expect(migratedBranding.logo).toBe(logo);

    const foundBranding = await brandingRepository.findOneByOrganizationId(orgId);
    expect(foundBranding).toEqual(migratedBranding);
    expect(organizationService.getOrganization).toHaveBeenCalledTimes(1);
  });
});
