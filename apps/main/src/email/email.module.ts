import { Module } from "@nestjs/common";
import { InstanceSettingsModule } from "../instance-settings/instance-settings.module";
import { EmailService } from "./email.service";
import { smtpTransporterProvider } from "./infrastructure/smtp-transporter.provider";

@Module({
  imports: [InstanceSettingsModule],
  providers: [EmailService, smtpTransporterProvider],
  exports: [EmailService],
})
export class EmailModule {}
