import process from "node:process";
import { Injectable, Logger } from "@nestjs/common";
import { isValidAppVersion, resolveAppVersion } from "../../domain/app-version";
import { Status } from "../../domain/status";
import { readBundledPackageVersion } from "../../infrastructure/package-json-version";

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);
  private warnedAboutInvalidEnvVersion = false;

  getStatus(): Status {
    const envVersion = process.env.APP_VERSION;
    this.warnAboutInvalidEnvVersion(envVersion);

    // The bundled package.json is the last resort so that an image built
    // without an APP_VERSION build argument still reports its real version.
    const version = resolveAppVersion([
      envVersion,
      process.env.npm_package_version,
      readBundledPackageVersion(),
    ]);

    return Status.create({ version });
  }

  private warnAboutInvalidEnvVersion(envVersion: string | undefined) {
    if (this.warnedAboutInvalidEnvVersion) {
      return;
    }
    if (!envVersion?.trim() || isValidAppVersion(envVersion)) {
      return;
    }
    this.warnedAboutInvalidEnvVersion = true;
    this.logger.warn(
      `Ignoring APP_VERSION="${envVersion}" because it is not a semantic version. ` +
        `Falling back to the version bundled with this build.`,
    );
  }
}
