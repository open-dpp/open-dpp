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

  // German mail uses a `-de.mjml` sibling of the base template; other languages use the base file.
  localizedName(language: LanguageType): string {
    if (language !== "de") {
      return this.name;
    }
    return this.name.replace(/\.mjml$/, "-de.mjml");
  }
}
