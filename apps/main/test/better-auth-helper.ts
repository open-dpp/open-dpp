import { randomUUID } from "node:crypto";
import { User as BetterAuthUser } from "better-auth";
import { AuthService } from "../src/auth/auth.service";

interface BetterAuthOrganization {
  id: string;
  name: string;
  slug: string;
  members: Array<{
    userId: string;
    organizationId: string;
    role: string;
  }>;
}

export class BetterAuthHelper {
  private authService: AuthService;
  private readonly defaultPassword = "password1234";

  public userMap = new Map<string, BetterAuthUser>();
  public organizationMap = new Map<string, BetterAuthOrganization>();
  private cookieCache = new Map<string, string>();

  setAuthService(authService: AuthService) {
    this.authService = authService;
  }

  async signAsUser(userId: string) {
    const cachedCookie = this.cookieCache.get(userId);
    if (cachedCookie) {
      return cachedCookie;
    }
    const user = this.userMap.get(userId);
    if (!user) {
      throw new Error("No user found");
    }
    const auth = this.authService.auth;
    if (!auth) {
      throw new Error("No auth setup");
    }
    const dataSignIn = await auth.api.signInEmail({
      body: {
        email: user.email,
        password: this.defaultPassword,
      },
      returnHeaders: true,
    });
    if (!dataSignIn) {
      throw new Error("Cannot sign in");
    }
    const setCookieHeader = dataSignIn.headers.get("set-cookie");
    if (!setCookieHeader) {
      throw new Error("No set-cookie header in response");
    }
    // Extract all Better Auth cookies (token + signature) from the Set-Cookie header string
    // The header may contain multiple cookies separated by commas, while each cookie has semicolon-separated attributes.
    // We only want the "name=value" part of cookies that start with "better-auth.".
    const matches = setCookieHeader.match(/(?:^|,\s*)(better-auth\.[^=]+=[^;]+)/g) || [];
    const cookie = matches
      .map(m => m.replace(/^,\s*/, "").trim())
      .filter(Boolean)
      .join("; ");
    if (!cookie) {
      throw new Error("Failed to parse Better Auth cookies from set-cookie header");
    }
    this.cookieCache.set(userId, cookie);
    return cookie;
  }

  async createUser() {
    const userEmail = `${randomUUID()}@test.test`;
    const auth = this.authService.auth;
    if (!auth) {
      throw new Error("No auth setup");
    }
    const body = {
      firstName: "First",
      lastName: "Last",
      email: userEmail,
      password: this.defaultPassword,
    } as any;
    const data = await auth.api.signUpEmail({
      body,
    });
    await this.authService.setUserEmailVerified(data.user.email, true);
    const user = data.user;
    this.userMap.set(user.id, user);
    return {
      userEmail,
      user,
    };
  }

  async createApiKey(userId: string) {
    const auth = this.authService.auth;
    if (!auth) {
      throw new Error("No auth setup");
    }
    const data = await (auth.api as any).createApiKey({
      body: {
        name: "project-api-key",
        userId,
      },
    });
    return data.key as string;
  }

  async createOrganization(userId: string): Promise<BetterAuthOrganization> {
    const auth = this.authService.auth;
    if (!auth) {
      throw new Error("No auth setup");
    }
    const dataOrg = await (auth.api as any).createOrganization({
      body: {
        name: "My Organization",
        slug: randomUUID(),
        userId,
        keepCurrentActiveOrganization: false,
      },
    }) as BetterAuthOrganization;
    this.organizationMap.set(dataOrg.id, dataOrg);
    return dataOrg;
  }

  async getRandomOrganizationAndUserWithCookie() {
    const keys = this.organizationMap.keys().toArray();
    if (keys.length === 0) {
      throw new Error("No organizations found");
    }
    const org = this.organizationMap.get(keys[Math.floor(Math.random() * keys.length)]);
    if (!org) {
      throw new Error("No organization found");
    }
    const randomMember = org?.members[Math.floor(Math.random() * org?.members.length)];
    const user = this.userMap.get(randomMember?.userId as string);
    if (!user) {
      throw new Error("No user found");
    }
    const userCookie = await this.signAsUser(user.id);
    return {
      org,
      user,
      userCookie,
    };
  }

  async createOrganizationAndUserWithCookie() {
    const userData = await this.createUser();
    const user = userData.user;
    const org = await this.createOrganization(user.id);
    if (!user) {
      throw new Error("No user found");
    }
    const userCookie = await this.signAsUser(user.id);
    return {
      org,
      user,
      userCookie,
    };
  }
}
