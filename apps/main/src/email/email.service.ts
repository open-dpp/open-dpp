import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Injectable, Logger } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import Handlebars from "handlebars";
import mjml2html from "mjml";
import { createTransport, Transporter } from "nodemailer";
import { InstanceSettingsService } from "../instance-settings/application/services/instance-settings.service";
import { BaseEmail } from "./domain/base-email";
import { buildSmtpOptions } from "./smtp-options";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  // only when OPEN_DPP_MAIL_HOST is configured
  private smtpTransporter?: Transporter;
  // sink used while mail is off: builds the message but sends nothing
  private readonly logTransporter: Transporter = createTransport({ jsonTransport: true });
  private configService: EnvService;
  private readonly logoUrl: string;

  constructor(
    configService: EnvService,
    private readonly instanceSettingsService: InstanceSettingsService,
  ) {
    this.configService = configService;
    this.logoUrl = `${this.configService.get("OPEN_DPP_URL")}/api/branding/instance/logo`;
    this.registerPartial("emailHead", "_head.mjml");
    this.registerPartial("emailHeader", "_header.mjml");
    // createTransport() does not connect, so this is safe at construction and
    // guarantees send() never runs before the transporter exists
    this.setupTransporter();
  }

  private registerPartial(name: string, file: string) {
    const content = readFileSync(resolve(__dirname, "templates", file), "utf-8");
    Handlebars.registerPartial(name, content);
  }

  private setupTransporter(): void {
    const host = this.configService.get("OPEN_DPP_MAIL_HOST");
    if (!host) {
      this.logger.warn(
        "Mail is disabled (OPEN_DPP_MAIL_HOST is not set): no mail will be sent. Verification, password-reset, email-change and invitation links are written to this log instead.",
      );
      return;
    }
    const options = buildSmtpOptions(this.configService);
    this.logger.log(`Sending mail via SMTP ${host}:${options.port}`);
    this.smtpTransporter = createTransport(options);
  }

  async compileMjml(mjml: string) {
    const { html } = mjml2html(mjml);
    return html;
  }

  private templateExists(template: string): boolean {
    return existsSync(resolve(__dirname, "templates", template));
  }

  private async activeTransporter(): Promise<Transporter> {
    if (!this.smtpTransporter) {
      return this.logTransporter;
    }
    const settings = await this.instanceSettingsService.getSettings();
    return settings.mailEnabled.value ? this.smtpTransporter : this.logTransporter;
  }

  async send(mail: BaseEmail) {
    const localized = mail.template.localizedName(mail.language);
    const template = this.templateExists(localized) ? localized : mail.template.name;
    const templatePath = resolve(__dirname, "templates", template);
    const templateContent = readFileSync(templatePath, "utf-8");
    const compiler = Handlebars.compile(templateContent);
    const compilerData = { ...mail.template.properties, logoUrl: this.logoUrl };
    const compiled = compiler(compilerData);
    const html = await this.compileMjml(compiled);
    const transporter = await this.activeTransporter();
    await transporter.sendMail({
      from: this.configService.get("OPEN_DPP_MAIL_SENDER_ADDRESS"),
      to: mail.to,
      subject: mail.subject,
      html,
    });
    if (transporter === this.logTransporter) {
      this.logger.warn(
        `Mail not sent (mail disabled): type=${mail.type} to=${mail.to} subject="${mail.subject}" links=${linksOf(mail).join(" ") || "-"}`,
      );
    }
  }
}

// Links come from the template properties (pre-escaping), so they are copy-pasteable.
function linksOf(mail: BaseEmail): string[] {
  return Object.values(mail.template.properties as Record<string, unknown>).filter(
    (value): value is string => typeof value === "string" && /^https?:\/\//.test(value),
  );
}
