import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import Handlebars from "handlebars";
import mjml2html from "mjml";
import { createTransport, Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { BaseEmail } from "./domain/base-email";

@Injectable()
export class EmailService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EmailService.name);

  private transporter: Transporter<SMTPTransport.SentMessageInfo>;
  private configService: EnvService;

  constructor(
    configService: EnvService,
  ) {
    this.configService = configService;
  }

  async setupTransporter() {
    this.logger.log("Using Test E-Mail Transporter to Mailpit");
    this.transporter = createTransport({
      host: this.configService.get("OPEN_DPP_MAIL_HOST"),
      port: this.configService.get("OPEN_DPP_MAIL_PORT"),
      auth: {
        user: this.configService.get("OPEN_DPP_MAIL_USER"),
        pass: this.configService.get("OPEN_DPP_MAIL_PASSWORD"),
      },
    } as SMTPTransport.Options);
  }

  async compileMjml(mjml: string) {
    const { html } = mjml2html(mjml);
    return html;
  }

  async send(mail: BaseEmail) {
    const templatePath = resolve(__dirname, "templates", mail.template);
    const templateContent = readFileSync(templatePath, "utf-8");
    const compiler = Handlebars.compile(templateContent);
    const compilerData = mail.templateProperties ?? {};
    const compiled = compiler(compilerData);
    const mjml = await this.compileMjml(compiled);
    await this.transporter.sendMail({
      from: "open-dpp",
      to: mail.to,
      subject: mail.subject,
      html: mjml,
    });
  }

  async onApplicationBootstrap() {
    await this.setupTransporter();
  }
}
