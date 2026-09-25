import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import { AasSerializationService } from "../../../aas/infrastructure/serialization/aas-serialization.service";
import { OfficialTemplateRepository } from "../../infrastructure/official-template.repository";
import { TemplateRepository } from "../../infrastructure/template.repository";
import { OfficialTemplatesImportService } from "./official-templates-import.service";

describe("OfficialTemplatesImportService", () => {
  let service: OfficialTemplatesImportService;

  const mockSource = {
    listTemplateFileNames: jest.fn<OfficialTemplateRepository["listTemplateFileNames"]>(),
    fetchTemplateFile: jest.fn<OfficialTemplateRepository["fetchTemplateFile"]>(),
  };

  const mockAasSerializationService = {
    importTemplate: jest.fn<AasSerializationService["importTemplate"]>(),
  };

  const mockTemplateRepository = {
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    service = new OfficialTemplatesImportService(
      mockSource as unknown as OfficialTemplateRepository,
      mockAasSerializationService as unknown as AasSerializationService,
      mockTemplateRepository as unknown as TemplateRepository,
    );
  });

  it("imports every file the source repo lists", async () => {
    mockSource.listTemplateFileNames.mockResolvedValue(["battery.json", "textile.json"]);
    mockSource.fetchTemplateFile.mockImplementation(async (fileName) => ({ fileName }));
    mockAasSerializationService.importTemplate.mockImplementation(
      async (data: any) => ({ id: `template-for-${data.fileName}` }) as any,
    );

    const result = await service.importOfficialTemplates("org-1");

    expect(result).toEqual({
      imported: [
        { fileName: "battery.json", templateId: "template-for-battery.json" },
        { fileName: "textile.json", templateId: "template-for-textile.json" },
      ],
      failed: [],
    });
    expect(mockAasSerializationService.importTemplate).toHaveBeenCalledTimes(2);
    expect(mockAasSerializationService.importTemplate).toHaveBeenCalledWith(
      { fileName: "battery.json" },
      "org-1",
      expect.any(Function),
    );
  });

  it("skips a file that fails to fetch or import and continues with the rest", async () => {
    mockSource.listTemplateFileNames.mockResolvedValue(["broken.json", "textile.json"]);
    mockSource.fetchTemplateFile.mockImplementation(async (fileName) => {
      if (fileName === "broken.json") {
        throw new Error("malformed JSON");
      }
      return { fileName };
    });
    mockAasSerializationService.importTemplate.mockImplementation(
      async (data: any) => ({ id: `template-for-${data.fileName}` }) as any,
    );

    const result = await service.importOfficialTemplates("org-1");

    expect(result.imported).toEqual([
      { fileName: "textile.json", templateId: "template-for-textile.json" },
    ]);
    expect(result.failed).toEqual([{ fileName: "broken.json", reason: "malformed JSON" }]);
  });

  it("reports a single failure and imports nothing when listing the source repo fails", async () => {
    mockSource.listTemplateFileNames.mockRejectedValue(new Error("GitHub unreachable"));

    const result = await service.importOfficialTemplates("org-1");

    expect(result).toEqual({
      imported: [],
      failed: [{ fileName: "*", reason: "Could not reach the official templates repository." }],
    });
    expect(mockSource.fetchTemplateFile).not.toHaveBeenCalled();
  });
});
