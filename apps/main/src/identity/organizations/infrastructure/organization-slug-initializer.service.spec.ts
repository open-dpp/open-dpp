import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { OrganizationsRepository } from "./adapters/organizations.repository";
import { OrganizationSlugInitializerService } from "./organization-slug-initializer.service";

describe("OrganizationSlugInitializerService", () => {
  let service: OrganizationSlugInitializerService;
  const alignSlugsWithIds = jest.fn<() => Promise<number>>();
  let errorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(async () => {
    alignSlugsWithIds.mockReset();
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const module = await Test.createTestingModule({
      providers: [
        OrganizationSlugInitializerService,
        { provide: OrganizationsRepository, useValue: { alignSlugsWithIds } },
      ],
    }).compile();
    service = module.get(OrganizationSlugInitializerService);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("aligns organization slugs with their ids on bootstrap", async () => {
    alignSlugsWithIds.mockResolvedValue(3);

    await service.onApplicationBootstrap();

    expect(alignSlugsWithIds).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs and survives a failing backfill", async () => {
    alignSlugsWithIds.mockRejectedValue(new Error("mongo down"));

    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
