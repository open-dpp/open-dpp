import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { HttpService } from "@nestjs/axios";
import { EnvService } from "@open-dpp/env";
import { AxiosResponse } from "axios";
import { of } from "rxjs";
import { OfficialTemplateRepository } from "./official-template.repository";

describe("OfficialTemplateSourceService", () => {
  let officialTemplateRepository: OfficialTemplateRepository;
  let httpServiceGetSpy: jest.SpiedFunction<HttpService["get"]>;
  const mockEnvService = {
    get: jest.fn<EnvService["get"]>((key: any): any => {
      const values: Record<string, string> = {
        OPEN_DPP_OFFICIAL_TEMPLATES_REPO_OWNER: "open-dpp",
        OPEN_DPP_OFFICIAL_TEMPLATES_REPO_NAME: "passport-templates",
        OPEN_DPP_OFFICIAL_TEMPLATES_REPO_BRANCH: "main",
      };
      return values[key];
    }),
  };

  beforeEach(() => {
    httpServiceGetSpy = jest.spyOn(HttpService.prototype, "get");
    officialTemplateRepository = new OfficialTemplateRepository(
      new HttpService(),
      mockEnvService as unknown as EnvService,
    );
  });

  afterEach(() => {
    httpServiceGetSpy.mockRestore();
  });

  it("lists only .json files from the configured repo/branch", async () => {
    httpServiceGetSpy.mockReturnValue(
      of({
        data: [
          { name: "battery.json", type: "file" },
          { name: "textile.json", type: "file" },
          { name: "README.md", type: "file" },
          { name: "templates", type: "dir" },
        ],
      } as AxiosResponse),
    );

    const fileNames = await officialTemplateRepository.listTemplateFileNames();

    expect(fileNames).toEqual(["battery.json", "textile.json"]);
    expect(httpServiceGetSpy).toHaveBeenCalledWith(
      "https://api.github.com/repos/open-dpp/passport-templates/contents",
      expect.objectContaining({ params: { ref: "main" } }),
    );
  });

  it("fetches a template file's raw content from the configured repo/branch", async () => {
    const payload = { id: "abc", environment: {} };
    httpServiceGetSpy.mockReturnValue(of({ data: payload } as AxiosResponse));

    const data = await officialTemplateRepository.fetchTemplateFile("battery.json");

    expect(data).toEqual(payload);
    expect(httpServiceGetSpy).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/open-dpp/passport-templates/main/battery.json",
    );
  });
});
