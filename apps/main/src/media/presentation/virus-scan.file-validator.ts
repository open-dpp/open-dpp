import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { HttpService } from "@nestjs/axios";
import { FileValidator } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EnvService } from "@open-dpp/env";
import FormData from "form-data";
import { firstValueFrom } from "rxjs";

interface VirusScanValidatorOptions {
  storageType: "disk" | "memory";
}

export class VirusScanFileValidator extends FileValidator<VirusScanValidatorOptions> {
  private readonly httpService = new HttpService();
  private readonly configService = new EnvService(new ConfigService());

  async isValid(file?: Express.Multer.File): Promise<boolean> {
    if (!file) {
      return false;
    }
    const clamAvUrl = this.configService.get("OPEN_DPP_CLAMAV_URL");
    if (!clamAvUrl) {
      return true; // virus scanning disabled (see docs/guides/production.md)
    }
    try {
      const form = new FormData();
      const fileContent =
        this.validationOptions.storageType === "disk"
          ? readFileSync(file.path)
          : file.buffer.toString();
      form.append("file", fileContent, file.originalname);

      try {
        const { status } = await firstValueFrom(this.httpService.post(`${clamAvUrl}/scan`, form));
        if (status === 200) {
          return true;
        }
      } catch (err: unknown) {
        console.error("Error during virus scan:", err);
      }

      if (this.validationOptions.storageType === "disk" && existsSync(file.path)) {
        unlinkSync(file.path); // delete a file when infected
      }
      return false;
    } catch (error) {
      console.error("Error during virus scan:", error);
      return false;
    }
  }

  buildErrorMessage(): string {
    return "The file was denied by our virus scanning system.";
  }
}
