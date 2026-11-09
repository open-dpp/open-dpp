import { Locator, Page } from "@playwright/test";
import { EnvConfig } from "../config";

/** The presentation view of a product, reached by a permalink. */
export class ProductPage {
  constructor(
    public readonly page: Page,
    private readonly permalinkId: string,
  ) {}

  url(): string {
    return `${EnvConfig.OPEN_DPP_URL}/p/${this.permalinkId}`;
  }

  async goto() {
    await this.page.goto(this.url());
  }

  professionalSignIn(): Locator {
    return this.page.getByText(/Als Fachperson anmelden|Sign in as professional/i);
  }

  async signInAsProfessional() {
    await this.professionalSignIn().first().click();
  }

  profileEntry(): Locator {
    return this.page.getByText(/Dein Profil|Your profile/i);
  }

  async openProfile() {
    await this.profileEntry().first().click();
  }

  signOutEntry(): Locator {
    return this.page.getByText(/Abmelden|Logout/i);
  }

  async signOut() {
    await this.signOutEntry().first().click();
  }

  async waitForPage() {
    await this.page.waitForURL(new RegExp(`/p/${this.permalinkId}`));
  }
}
