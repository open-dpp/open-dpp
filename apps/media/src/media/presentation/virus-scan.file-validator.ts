import { HttpService } from '@nestjs/axios';
import { FileValidator } from '@nestjs/common';
import FormData from 'form-data';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

interface VirusScanValidatorOptions {
  storageType: 'disk' | 'memory';
}

export class VirusScanFileValidator extends FileValidator<VirusScanValidatorOptions> {
  private readonly httpService = new HttpService();
  private readonly configService = new ConfigService();

  async isValid(file?: Express.Multer.File): Promise<boolean> {
    const clamAvUrl = `${this.configService.get('CLAMAV_URL')}:${this.configService.get('CLAMAV_PORT')}`;
    try {
      const form = new FormData();

      if (!file) {
        return false;
      }

      const fileContent =
        this.validationOptions.storageType === 'disk'
          ? readFileSync(file.path)
          : file.buffer.toString();
      form.append('file', fileContent, file.originalname);

      try {
        const result = (
          await firstValueFrom(this.httpService.post(`${clamAvUrl}/scan`, form))
        ).status;
        if (result === 200) {
          return true;
        }
      } catch (err: unknown) {
        console.error('Error during virus scan:', err);
        if (
          typeof err === 'object' &&
          err !== null &&
          'syscall' in err &&
          err.syscall === 'getaddrinfo' &&
          process.env.NODE_ENV === 'LOCAL'
        ) {
          return true; // ignore if in LOCAL env and clamav is not available
        }
      }

      if (
        this.validationOptions.storageType === 'disk' &&
        existsSync(file.path)
      ) {
        unlinkSync(file.path); // delete a file when infected
      }
      return false;
    } catch (error) {
      console.error('Error during virus scan:', error);
      return false;
    }
  }

  buildErrorMessage(): string {
    return 'The file was denied by our virus scanning system.';
  }
}
