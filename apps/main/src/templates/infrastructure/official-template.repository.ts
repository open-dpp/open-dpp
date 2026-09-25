import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { firstValueFrom } from "rxjs";

interface GithubContentEntry {
  name: string;
  type: string;
}

// "<provider>:<owner>/<repo>" or "<provider>:<owner>/<repo>@<branch>" — already validated by the
// env schema (packages/env/src/env.ts), so a mismatch here would indicate that validation regressed.
const OFFICIAL_TEMPLATES_REPO_PATTERN = /^([a-z][a-z0-9-]*):([^/\s]+)\/([^@\s]+)(?:@(\S+))?$/;

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
        // Omitting `ref` makes GitHub resolve the repo's current default branch itself.
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
        // "HEAD" is GitHub's alias for the repo's current default branch.
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch ?? "HEAD"}/${fileName}`,
      ),
    );
    return data;
  }

  private getGithubRepoConfig(): { owner: string; repo: string; branch?: string } {
    const raw = this.envService.get("OPEN_DPP_OFFICIAL_TEMPLATES_REPO");
    const match = OFFICIAL_TEMPLATES_REPO_PATTERN.exec(raw);
    if (!match) {
      throw new Error(`Invalid OPEN_DPP_OFFICIAL_TEMPLATES_REPO value: "${raw}"`);
    }
    const [, provider, owner, repo, branch] = match;
    if (provider !== "github") {
      throw new Error(`Unsupported official templates provider "${provider}"`);
    }
    return { owner, repo, branch };
  }
}
