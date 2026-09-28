import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import { OrganizationCreatedEvent } from "../../../identity/organizations/domain/events/organization-created.event";
import { OfficialTemplatesImportService } from "../services/official-templates-import.service";
import { OrganizationCreatedListener } from "./organization-created.listener";

describe("OrganizationCreatedListener", () => {
  let listener: OrganizationCreatedListener;

  const mockOfficialTemplatesImportService = {
    importOfficialTemplates: jest.fn<OfficialTemplatesImportService["importOfficialTemplates"]>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    listener = new OrganizationCreatedListener(
      mockOfficialTemplatesImportService as unknown as OfficialTemplatesImportService,
    );
  });

  it("imports official templates for the organization named in the event", () => {
    mockOfficialTemplatesImportService.importOfficialTemplates.mockResolvedValue({
      imported: [],
      failed: [],
    });

    listener.handleOrganizationCreated(
      OrganizationCreatedEvent.create({ organizationId: "org-1" }),
    );

    expect(mockOfficialTemplatesImportService.importOfficialTemplates).toHaveBeenCalledWith(
      "org-1",
    );
  });

  it("does not throw when the import rejects", async () => {
    let rejectImport: (error: Error) => void = () => {};
    mockOfficialTemplatesImportService.importOfficialTemplates.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectImport = reject;
      }),
    );

    expect(() =>
      listener.handleOrganizationCreated(
        OrganizationCreatedEvent.create({ organizationId: "org-1" }),
      ),
    ).not.toThrow();

    rejectImport(new Error("GitHub unreachable"));
    await Promise.resolve();
  });
});
