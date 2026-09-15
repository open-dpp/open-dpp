import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { InternalServerErrorException, Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PolicyManagementService } from "../../../../policy/application/services/policy-management.service";
import { User } from "../../../users/domain/user";
import { UserRole } from "../../../users/domain/user-role.enum";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { Organization } from "../../domain/organization";
import { OrganizationsRepository } from "../../infrastructure/adapters/organizations.repository";
import { ProvisioningMailer } from "../../infrastructure/provisioning-mailer";
import {
  OrganizationProvisioningService,
  ProvisionOrganizationCommand,
} from "./organization-provisioning.service";

function makeUser(overrides: Partial<Parameters<typeof User.loadFromDb>[0]> = {}): User {
  return User.loadFromDb({
    id: "user-1",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: UserRole.USER,
    preferredLanguage: "de",
    ...overrides,
  });
}

const organization = Organization.loadFromDb({
  id: "org-1",
  name: "ACME GmbH",
  slug: "org-1",
  logo: null,
  metadata: {},
  createdAt: new Date(),
});

const newUser = makeUser();

const command: ProvisionOrganizationCommand = {
  name: "ACME GmbH",
  owner: { email: "Jane@Example.com", firstName: "Jane", lastName: "Doe", locale: "de" },
  adminUserId: "admin-1",
};

describe("OrganizationProvisioningService", () => {
  let service: OrganizationProvisioningService;
  let logError: jest.SpiedFunction<typeof Logger.prototype.error>;

  const usersRepository = {
    findOneByEmail: jest.fn<(email: string) => Promise<User | null>>(),
    save: jest.fn<(user: User) => Promise<User | null>>(),
    rollbackCreatedUser: jest.fn<(id: string) => Promise<void>>(),
  };
  const organizationsRepository = {
    createForUser:
      jest.fn<(organization: Organization, userId: string) => Promise<Organization | null>>(),
  };
  const policyManagementService = {
    ensureDefaultPolicies: jest.fn<(organizationId: string) => Promise<void>>(),
  };
  const mailer = {
    notifyOwner: jest.fn<(input: unknown) => Promise<boolean>>(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    usersRepository.findOneByEmail.mockResolvedValue(null);
    usersRepository.save.mockResolvedValue(newUser);
    usersRepository.rollbackCreatedUser.mockResolvedValue(undefined);
    organizationsRepository.createForUser.mockResolvedValue(organization);
    policyManagementService.ensureDefaultPolicies.mockResolvedValue(undefined);
    mailer.notifyOwner.mockResolvedValue(true);
    logError = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationProvisioningService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: OrganizationsRepository, useValue: organizationsRepository },
        { provide: PolicyManagementService, useValue: policyManagementService },
        { provide: ProvisioningMailer, useValue: mailer },
      ],
    }).compile();
    service = module.get(OrganizationProvisioningService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates the user when the email is unknown and makes it the only owner", async () => {
    const result = await service.provision(command);

    expect(usersRepository.findOneByEmail).toHaveBeenCalledWith("jane@example.com");
    const [savedUser] = usersRepository.save.mock.calls[0];
    expect(savedUser).toBeInstanceOf(User);
    expect(savedUser).toEqual(
      expect.objectContaining({
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Doe",
        role: UserRole.USER,
        preferredLanguage: "de",
        emailVerified: false,
      }),
    );
    expect(organizationsRepository.createForUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ACME GmbH" }),
      "user-1",
    );
    expect(policyManagementService.ensureDefaultPolicies).toHaveBeenCalledWith("org-1");
    expect(mailer.notifyOwner).toHaveBeenCalledWith({
      user: newUser,
      organization,
      language: "de",
    });
    expect(result).toEqual({
      organization,
      owner: { id: "user-1", email: "jane@example.com", created: true },
      emailSent: true,
    });
  });

  it("stores empty names when the owner has none", async () => {
    await service.provision({ ...command, owner: { email: "jane@example.com", locale: "en" } });

    const [savedUser] = usersRepository.save.mock.calls[0];
    expect(savedUser).toEqual(
      expect.objectContaining({ firstName: "", lastName: "", preferredLanguage: "en" }),
    );
  });

  it("uses an existing user untouched and mails in the user's preferred language", async () => {
    const existing = makeUser({ id: "user-9", preferredLanguage: "en", emailVerified: true });
    usersRepository.findOneByEmail.mockResolvedValue(existing);

    const result = await service.provision(command);

    expect(usersRepository.save).not.toHaveBeenCalled();
    expect(organizationsRepository.createForUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ACME GmbH" }),
      "user-9",
    );
    expect(mailer.notifyOwner).toHaveBeenCalledWith({
      user: existing,
      organization,
      language: "en",
    });
    expect(result.owner).toEqual({ id: "user-9", email: "jane@example.com", created: false });
  });

  it("continues as an existing user when a concurrent call created it first", async () => {
    const racedUser = makeUser({ id: "user-7" });
    usersRepository.save.mockResolvedValue(null);
    usersRepository.findOneByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce(racedUser);

    const result = await service.provision(command);

    expect(result.owner).toEqual({ id: "user-7", email: "jane@example.com", created: false });
    expect(organizationsRepository.createForUser).toHaveBeenCalledWith(expect.anything(), "user-7");
    expect(usersRepository.rollbackCreatedUser).not.toHaveBeenCalled();
  });

  it("fails before touching the organization when the user cannot be created", async () => {
    usersRepository.save.mockResolvedValue(null);

    await expect(service.provision(command)).rejects.toThrow(InternalServerErrorException);

    expect(organizationsRepository.createForUser).not.toHaveBeenCalled();
    expect(mailer.notifyOwner).not.toHaveBeenCalled();
  });

  it("removes a newly created user again when the organization cannot be created", async () => {
    organizationsRepository.createForUser.mockRejectedValue(new Error("better-auth down"));

    await expect(service.provision(command)).rejects.toThrow(InternalServerErrorException);

    expect(usersRepository.rollbackCreatedUser).toHaveBeenCalledWith("user-1");
    expect(policyManagementService.ensureDefaultPolicies).not.toHaveBeenCalled();
    expect(mailer.notifyOwner).not.toHaveBeenCalled();
  });

  it("treats an empty create result like a failure and rolls back", async () => {
    organizationsRepository.createForUser.mockResolvedValue(null);

    await expect(service.provision(command)).rejects.toThrow(InternalServerErrorException);

    expect(usersRepository.rollbackCreatedUser).toHaveBeenCalledWith("user-1");
  });

  it("never removes an existing user when the organization cannot be created", async () => {
    usersRepository.findOneByEmail.mockResolvedValue(makeUser({ id: "user-9" }));
    organizationsRepository.createForUser.mockRejectedValue(new Error("better-auth down"));

    await expect(service.provision(command)).rejects.toThrow(InternalServerErrorException);

    expect(usersRepository.rollbackCreatedUser).not.toHaveBeenCalled();
  });

  it("still fails and logs the orphaned user when the rollback itself fails", async () => {
    organizationsRepository.createForUser.mockRejectedValue(new Error("better-auth down"));
    usersRepository.rollbackCreatedUser.mockRejectedValue(new Error("delete failed"));

    await expect(service.provision(command)).rejects.toThrow(InternalServerErrorException);

    expect(logError).toHaveBeenCalledWith(expect.stringContaining("user-1"), expect.anything());
  });

  it("tolerates a failing default-policy seed", async () => {
    policyManagementService.ensureDefaultPolicies.mockRejectedValue(new Error("seed failed"));

    const result = await service.provision(command);

    expect(result.organization).toBe(organization);
    expect(logError).toHaveBeenCalled();
  });

  it("reports when not every mail was sent", async () => {
    mailer.notifyOwner.mockResolvedValue(false);

    const result = await service.provision(command);

    expect(result.emailSent).toBe(false);
  });
});
