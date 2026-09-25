import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { firstValueFrom } from "rxjs";

interface GithubContentEntry {
  name: string;
  type: string;
}

@Injectable()
export class OfficialTemplateRepository {
  constructor(
    private readonly httpService: HttpService,
    private readonly envService: EnvService,
  ) {}

  async listTemplateFileNames(): Promise<string[]> {
    const { owner, repo, branch } = this.getGithubRepoConfig();
    const { data } = await firstValueFrom(
      this.httpService.get<GithubContentEntry[]>(
        `https://api.github.com/repos/${owner}/${repo}/contents`,
        { params: { ref: branch }, headers: { Accept: "application/vnd.github+json" } },
      ),
    );
    return data
      .filter((entry) => entry.type === "file" && entry.name.endsWith(".json"))
      .map((entry) => entry.name);
  }

  async fetchTemplateFile(fileName: string): Promise<unknown> {
    const { owner, repo, branch } = this.getGithubRepoConfig();
    const { data } = await firstValueFrom(
      this.httpService.get<unknown>(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fileName}`,
      ),
    );
    return data;
  }

  private getGithubRepoConfig(): { owner: string; repo: string; branch: string } {
    return {
      owner: this.envService.get("OPEN_DPP_OFFICIAL_TEMPLATES_REPO_OWNER"),
      repo: this.envService.get("OPEN_DPP_OFFICIAL_TEMPLATES_REPO_NAME"),
      branch: this.envService.get("OPEN_DPP_OFFICIAL_TEMPLATES_REPO_BRANCH"),
    };
  }
}
