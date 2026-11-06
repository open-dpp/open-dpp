import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ConsoleLogger, Inject, Injectable } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import Handlebars from "handlebars";
import mjml2html from "mjml";
import { Transporter } from "nodemailer";
import { InstanceSettingsService } from "../instance-settings/application/services/instance-settings.service";
import { BaseEmail } from "./domain/base-email";
import { SMTP_TRANSPORTER } from "./infrastructure/smtp-transporter.provider";

@Injectable()
export class EmailService {
  private readonly mailLinkLogger: ConsoleLogger;
  private readonly logoUrl: string;

  constructor(
    private readonly configService: EnvService,
    private readonly instanceSettingsService: InstanceSettingsService,
    @Inject(SMTP_TRANSPORTER) private readonly smtpTransporter: Transporter | null,
  ) {
    this.logoUrl = `${this.configService.get("OPEN_DPP_URL")}/api/branding/instance/logo`;
    // not the app logger: while mail is off this line is the only way a Mail Link reaches
    // anyone, so OPEN_DPP_LOG_LEVEL must not be able to filter it out
    this.mailLinkLogger = new ConsoleLogger(EmailService.name, {
      json: this.configService.get("OPEN_DPP_LOG_FORMAT") === "json",
      logLevels: ["warn"],
    });
    this.registerPartial("emailHead", "_head.mjml");
    this.registerPartial("emailHeader", "_header.mjml");
  }

  private registerPartial(name: string, file: string) {
    const content = readFileSync(resolve(__dirname, "templates", file), "utf-8");
    Handlebars.registerPartial(name, content);
  }

  async compileMjml(mjml: string) {
    const { html } = mjml2html(mjml);
    return html;
  }

  private templateExists(template: string): boolean {
    return existsSync(resolve(__dirname, "templates", template));
  }

  private async render(mail: BaseEmail): Promise<string> {
    const localized = mail.template.localizedName(mail.language);
    const template = this.templateExists(localized) ? localized : mail.template.name;
    const templateContent = readFileSync(resolve(__dirname, "templates", template), "utf-8");
    const compiler = Handlebars.compile(templateContent);
    const compiled = compiler({ ...mail.template.properties, logoUrl: this.logoUrl });
    return this.compileMjml(compiled);
  }

  /** The transporter to send through, or `null` while mail is off. */
  private async activeTransporter(): Promise<Transporter | null> {
    // mailEnabled is already forced off while no SMTP host is configured
    const { mailEnabled } = await this.instanceSettingsService.getSettings();
    return mailEnabled.value ? this.smtpTransporter : null;
  }

  async send(mail: BaseEmail) {
    const transporter = await this.activeTransporter();
    if (!transporter) {
      // logged before rendering, so the links reach the operator even if the template breaks
      this.mailLinkLogger.warn(
        `Mail not sent (mail disabled): type=${mail.type} to=${mail.to} subject="${mail.subject}" links=${mail.links().join(" ") || "-"}`,
      );
    }
    // rendered either way, so a broken template fails the same with mail on or off
    const html = await this.render(mail);
    if (!transporter) {
      return;
    }
    await transporter.sendMail({
      from: this.configService.get("OPEN_DPP_MAIL_SENDER_ADDRESS"),
      to: mail.to,
      subject: mail.subject,
      html,
    });
  }
}
