import { APIRequestContext } from "@playwright/test";
import { MailpitConfig } from "../config";

export interface MailpitAddress {
  Name: string;
  Address: string;
}
export interface MailpitSummary {
  ID: string;
  Subject: string;
  To: MailpitAddress[];
  From: MailpitAddress;
  Created: string;
}
export interface MailpitMessage {
  ID: string;
  Subject: string;
  Text: string;
  HTML: string;
  To: MailpitAddress[];
  From: MailpitAddress;
}

// Mail HTML entity-encodes link query separators (the verify link arrives as
// ".../verify-email?token&#x3D;eyJ..."), so decode before any page.goto().
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

function firstHref(msg: MailpitMessage, pattern: RegExp): string {
  const source = msg.HTML || msg.Text || "";
  const m = source.match(pattern);
  if (!m) {
    throw new Error(`No link matching ${pattern} in message "${msg.Subject}"`);
  }
  return decodeEntities(m[1]);
}

/**
 * Thin Mailpit HTTP client. Parallel-safe: matches strictly by unique recipient
 * (each disposable user has a uuid address); never deletes the whole inbox.
 */
export class MailpitClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string = MailpitConfig.baseUrl,
  ) {}

  async search(query: string): Promise<MailpitSummary[]> {
    const res = await this.request.get(
      `${this.baseUrl}/api/v1/search?query=${encodeURIComponent(query)}`,
    );
    if (!res.ok()) {
      throw new Error(`Mailpit search failed (${res.status()}) for "${query}"`);
    }
    return ((await res.json()).messages as MailpitSummary[]) ?? [];
  }

  async getMessageById(id: string): Promise<MailpitMessage> {
    const res = await this.request.get(`${this.baseUrl}/api/v1/message/${id}`);
    if (!res.ok()) {
      throw new Error(`Mailpit get message ${id} failed (${res.status()})`);
    }
    return res.json();
  }

  async waitForMessage(opts: {
    to: string;
    subjectContains?: string;
    since?: Date;
    timeoutMs?: number;
    intervalMs?: number;
  }): Promise<MailpitMessage> {
    const { to, subjectContains, since, timeoutMs = 20000, intervalMs = 500 } = opts;
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const matches = (await this.search(`to:${to}`)).filter(
        (m) =>
          (!subjectContains || m.Subject.includes(subjectContains)) &&
          (!since || new Date(m.Created).getTime() >= since.getTime() - 2000),
      );
      if (matches.length) {
        return this.getMessageById(matches[0].ID);
      }
      if (Date.now() > deadline) {
        throw new Error(
          `Timed out (${timeoutMs}ms) waiting for mail to=${to} subject~="${subjectContains ?? ""}"`,
        );
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  async clearInboxFor(to: string): Promise<void> {
    const ids = (await this.search(`to:${to}`)).map((m) => m.ID);
    if (!ids.length) return;
    const res = await this.request.delete(`${this.baseUrl}/api/v1/messages`, {
      data: { IDs: ids },
    });
    if (!res.ok()) {
      throw new Error(`Mailpit scoped clear failed (${res.status()}) for ${to}`);
    }
  }

  async expectNoMessage(opts: {
    to: string;
    subjectContains?: string;
    windowMs?: number;
  }): Promise<void> {
    const { to, subjectContains, windowMs = 4000 } = opts;
    const deadline = Date.now() + windowMs;
    for (;;) {
      const matches = (await this.search(`to:${to}`)).filter(
        (m) => !subjectContains || m.Subject.includes(subjectContains),
      );
      if (matches.length) {
        throw new Error(`Unexpected mail to=${to} subject~="${subjectContains ?? ""}"`);
      }
      if (Date.now() > deadline) return;
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  static getVerifyLink(msg: MailpitMessage): string {
    return firstHref(msg, /href="([^"]*\/verify-email\?token[^"]*)"/);
  }

  static getRevokeLink(msg: MailpitMessage): string {
    return firstHref(msg, /href="([^"]*\/users\/email-change\/revoke\?token[^"]*)"/);
  }
}
