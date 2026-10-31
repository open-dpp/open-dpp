import { randomUUID } from "node:crypto";
import { type Mocked, afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
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
    getOrganization: vi.fn(),
  } as unknown as Mocked<OrganizationsService>;

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
    vi.clearAllMocks();
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
    vi.spyOn(organizationService, "getOrganization").mockResolvedValue(
      Organization.create({
        name: "acme",
      }),
    );

    await brandingRepository.save(branding);
    const foundBranding = await brandingRepository.findOneByOrganizationId(orgId);
    expect(foundBranding).toEqual(branding);
  });

  it("should return logo from organization to branding", async () => {
    const orgId = randomUUID();
    const logo = "logo-from-organization";

    vi.spyOn(organizationService, "getOrganization").mockResolvedValue(
      Organization.create({
        name: "acme",
        logo,
      }),
    );

    const migratedBranding = await brandingRepository.findOneByOrganizationId(orgId);
    expect(organizationService.getOrganization).toHaveBeenCalledWith(orgId);
    expect(migratedBranding.organizationId).toBe(orgId);
    expect(migratedBranding.logo).toBe(logo);
  });

  it("should migrate logo from organization on save", async () => {
    const orgId = randomUUID();
    const logo = "logo-from-organization";

    vi.spyOn(organizationService, "getOrganization").mockResolvedValue(
      Organization.create({
        name: "acme",
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

  describe("findOneByOrganizationIdOrNull", () => {
    it("returns null when the organization is not found (tolerates the throw)", async () => {
      const orgId = randomUUID();
      vi.spyOn(organizationService, "getOrganization").mockResolvedValue(
        null as unknown as Organization,
      );

      const result = await brandingRepository.findOneByOrganizationIdOrNull(orgId);

      expect(result).toBeNull();
      expect(organizationService.getOrganization).toHaveBeenCalledWith(orgId);
    });

    it("returns the branding when it resolves", async () => {
      const orgId = randomUUID();
      vi.spyOn(organizationService, "getOrganization").mockResolvedValue(
        Organization.create({
          name: "acme",
        }),
      );

      const result = await brandingRepository.findOneByOrganizationIdOrNull(orgId);

      expect(result).not.toBeNull();
      expect(result?.organizationId).toBe(orgId);
    });
  });
});
