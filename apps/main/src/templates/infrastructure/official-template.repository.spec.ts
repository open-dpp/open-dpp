import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { HttpService } from "@nestjs/axios";
import { EnvService } from "@open-dpp/env";
import { AxiosResponse } from "axios";
import { of } from "rxjs";
import { OfficialTemplateRepository } from "./official-template.repository";

describe("OfficialTemplateRepository", () => {
  let officialTemplateRepository: OfficialTemplateRepository;
  let httpServiceGetSpy: jest.SpiedFunction<HttpService["get"]>;
  let repoEnvValue: string;
  const mockEnvService = {
    get: jest.fn<EnvService["get"]>((): any => repoEnvValue),
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

  it("lists only .json files from the configured repo, pinning the branch when given", async () => {
    repoEnvValue = "github:open-dpp/passport-templates@main";
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

  it("lists files without a ref when no branch is pinned, letting GitHub resolve the default branch", async () => {
    repoEnvValue = "github:open-dpp/passport-templates";
    httpServiceGetSpy.mockReturnValue(of({ data: [] } as AxiosResponse));

    await officialTemplateRepository.listTemplateFileNames();

    expect(httpServiceGetSpy).toHaveBeenCalledWith(
      "https://api.github.com/repos/open-dpp/passport-templates/contents",
      expect.objectContaining({ params: { ref: undefined } }),
    );
  });

  it("fetches a template file's raw content from the pinned branch", async () => {
    repoEnvValue = "github:open-dpp/passport-templates@main";
    const payload = { id: "abc", environment: {} };
    httpServiceGetSpy.mockReturnValue(of({ data: payload } as AxiosResponse));

    const data = await officialTemplateRepository.fetchTemplateFile("battery.json");

    expect(data).toEqual(payload);
    expect(httpServiceGetSpy).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/open-dpp/passport-templates/main/battery.json",
    );
  });

  it("fetches raw content from HEAD when no branch is pinned", async () => {
    repoEnvValue = "github:open-dpp/passport-templates";
    httpServiceGetSpy.mockReturnValue(of({ data: {} } as AxiosResponse));

    await officialTemplateRepository.fetchTemplateFile("battery.json");

    expect(httpServiceGetSpy).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/open-dpp/passport-templates/HEAD/battery.json",
    );
  });

  it("throws when the configured value doesn't match <provider>:<owner>/<repo>", async () => {
    repoEnvValue = "open-dpp/passport-templates";

    await expect(officialTemplateRepository.listTemplateFileNames()).rejects.toThrow(
      /Invalid OPEN_DPP_OFFICIAL_TEMPLATES_REPO value/,
    );
  });

  it("throws for a provider other than github", async () => {
    repoEnvValue = "gitlab:open-dpp/passport-templates";

    await expect(officialTemplateRepository.listTemplateFileNames()).rejects.toThrow(
      /Unsupported official templates provider "gitlab"/,
    );
  });
});
