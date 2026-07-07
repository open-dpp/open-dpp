import { randomUUID } from "node:crypto";
import { BaseEmail } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";
import { EmailTemplate } from "./email-template";

export interface InviteUserToOrganizationMailTemplateProps extends BaseEmailTemplateProperties {
  link: string;
  firstName: string;
  organizationName: string;
}
export interface InviteUserToOrganizationMailCreateProps {
  to: string;
  subject: string;
  templateProperties: InviteUserToOrganizationMailTemplateProps;
}

export class InviteUserToOrganizationMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: InviteUserToOrganizationMailTemplateProps,
  ) {
    super(
      id,
      "INVITE_USER_TO_ORGANIZATION",
      new EmailTemplate("invite-user-to-organization.mjml", templateProperties),
      to,
      subject,
    );
  }

  public static create(data: InviteUserToOrganizationMailCreateProps) {
    return new InviteUserToOrganizationMail(
      randomUUID(),
      data.to,
      data.subject,
      data.templateProperties,
    );
  }
}
