import { LanguageType } from "@open-dpp/dto";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";

/**
 * A mail template: the .mjml file name plus the properties rendered into it.
 * Owns the language→file-name convention. Existence checking and fallback stay
 * in the infrastructure layer (EmailService) since they need filesystem access.
 */
export class EmailTemplate {
  constructor(
    public readonly name: string,
    public readonly properties: BaseEmailTemplateProperties,
  ) {}

  // A localized mail is a `-${language}.mjml` sibling of the base template
  // (e.g. `foo-de.mjml`). When that sibling is missing the base file is used —
  // the existence check and fallback live in the infrastructure layer (EmailService).
  localizedName(language: LanguageType): string {
    return this.name.replace(/\.mjml$/, `-${language}.mjml`);
  }
}
