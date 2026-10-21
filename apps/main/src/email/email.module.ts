import { Module } from "@nestjs/common";
import { InstanceSettingsModule } from "../instance-settings/instance-settings.module";
import { EmailService } from "./email.service";

@Module({
  imports: [InstanceSettingsModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
