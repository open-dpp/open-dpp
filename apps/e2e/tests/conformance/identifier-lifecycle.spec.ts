/**
 * Identifier life cycle (EN 18219 clause 4): an identifier in use is never handed to a second
 * passport, and once its passport is published it can be neither changed nor withdrawn. Plus the
 * character set of every identifier URI the instance exposes.
 */
import type { APIRequestContext } from "@playwright/test";
import { ApiBase } from "../config";
import { newAnonymousContext } from "../helpers/anonymous";
import { ORG_ID_HEADER, uniqueSerial } from "../helpers/passport";
import { check, expect } from "./checks";
import { readSubject } from "./subject";

type Listed<T> = T[] | { result?: T[]; data?: T[]; items?: T[] };
type Upi = { uuid: string; type: string; gtin: string | null; digitalLink: string | null };
type Permalink = { id: string; kind: string; publicUrl: string };

const items = <T>(body: Listed<T>): T[] =>
  Array.isArray(body) ? body : (body.result ?? body.data ?? body.items ?? []);

const orgHeaders = (orgId: string) => ({ [ORG_ID_HEADER]: orgId });

/** A blank draft passport in the subject's organisation, deleted again by the returned callback. */
const draftPassport = async (
  request: APIRequestContext,
  orgId: string,
): Promise<{ passportId: string; remove: () => Promise<void> }> => {
  const created = await request.post(`${ApiBase}/passports`, {
    headers: orgHeaders(orgId),
    data: { environment: { assetAdministrationShells: [] } },
  });
  expect(created.status(), "a blank draft passport should be created").toBe(201);
  const { id } = (await created.json()) as { id: string };
  return {
    passportId: id,
    remove: async () => {
      const deleted = await request.delete(`${ApiBase}/passports/${id}`, {
        headers: orgHeaders(orgId),
      });
      expect(deleted.ok(), `the draft passport ${id} should be deleted again`).toBeTruthy();
    },
  };
};

const subjectGs1Upi = async (request: APIRequestContext): Promise<Upi> => {
  const { orgId, passportId } = readSubject();
  const list = await request.get(`${ApiBase}/passports/${passportId}/unique-product-identifiers`, {
    headers: orgHeaders(orgId),
  });
  expect(list.ok()).toBeTruthy();
  const gs1 = items((await list.json()) as Listed<Upi>).find((upi) => upi.type === "GS1");
  expect(gs1, "the published subject carries a GS1 identity").toBeDefined();
  return gs1 as Upi;
};

/** RFC 3986 URI characters only: unreserved, reserved and percent-encoded octets (7-bit by construction). */
const RFC3986_URI = /^(?:[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]|%[0-9A-Fa-f]{2})+$/;

check(
  {
    id: "identifiers.gs1-identity-unique",
    title: "a GS1 identity already in use cannot be assigned to a second passport",
    criteria: ["EN18219-4.1.2(1)", "EN18219-4.1.2(3)"],
  },
  async ({ request }) => {
    const { orgId, gtin, serial } = readSubject();
    const second = await draftPassport(request, orgId);
    try {
      const duplicate = await request.post(`${ApiBase}/unique-product-identifiers`, {
        headers: orgHeaders(orgId),
        data: { referenceId: second.passportId, gtin, serial },
      });
      expect(duplicate.status()).toBe(409);
    } finally {
      await second.remove();
    }
  },
);

/** A GTIN-13 under GS1 prefix 20 (restricted circulation, unique only within a region), valid check digit. */
const RESTRICTED_CIRCULATION_GTIN = "2001234567893";

check(
  {
    id: "identifiers.item-key-single-passport",
    title:
      "a GTIN and serial number name one item: the pair cannot go to a second passport under a batch",
    criteria: ["EN18219-4.1.2(1)", "EN18219-4.1.2(2)", "EN18219-4.1.2(3)", "EN18219-4.2.2(1)"],
  },
  async ({ request }) => {
    const { orgId, gtin, serial } = readSubject();
    const second = await draftPassport(request, orgId);
    const sameItem = await request.post(`${ApiBase}/unique-product-identifiers`, {
      headers: orgHeaders(orgId),
      data: { referenceId: second.passportId, gtin, batch: uniqueSerial("b").slice(0, 20), serial },
    });
    await second.remove();
    expect(sameItem.status(), "the subject's GTIN and serial are already in use").toBe(409);
  },
);

check(
  {
    id: "identifiers.restricted-gtin-refused",
    title:
      "a restricted circulation number (GS1 prefix 02, 04 or 20 to 29) is refused as a GS1 identity",
    criteria: ["EN18219-4.1.2(2)"],
  },
  async ({ request }) => {
    const { orgId } = readSubject();
    const draft = await draftPassport(request, orgId);
    const restricted = await request.post(`${ApiBase}/unique-product-identifiers`, {
      headers: orgHeaders(orgId),
      data: {
        referenceId: draft.passportId,
        gtin: RESTRICTED_CIRCULATION_GTIN,
        serial: uniqueSerial("rcn"),
      },
    });
    await draft.remove();
    expect(
      restricted.status(),
      "a restricted circulation number is not globally unique",
    ).toBeGreaterThanOrEqual(400);
    expect(restricted.status()).toBeLessThan(500);
  },
);

check(
  {
    id: "identifiers.published-identity-locked",
    title: "the GS1 identity of a published passport can be neither changed nor deleted",
    criteria: ["EN18219-4.1.2(1)", "EN18219-4.1.2(3)", "EN18219-4.2.2(1)", "EN18219-4.4.2(2)"],
  },
  async ({ request }) => {
    const { orgId, gtin } = readSubject();
    const upi = await subjectGs1Upi(request);
    const changed = await request.patch(`${ApiBase}/unique-product-identifiers/${upi.uuid}`, {
      headers: orgHeaders(orgId),
      data: { gtin, serial: uniqueSerial("moved") },
    });
    expect(changed.status(), "changing a published identity is refused").toBe(409);
    const deleted = await request.delete(`${ApiBase}/unique-product-identifiers/${upi.uuid}`, {
      headers: orgHeaders(orgId),
    });
    expect(deleted.status(), "deleting a published identity is refused").toBe(409);
    const after = await subjectGs1Upi(request);
    expect(after.digitalLink).toBe(upi.digitalLink);
  },
);

check(
  {
    id: "identifiers.published-permalink-locked",
    title: "a published permalink can be neither deleted nor given another slug",
    criteria: ["EN18219-4.1.2(1)", "EN18219-4.2.2(1)"],
  },
  async ({ request }) => {
    const { orgId, passportId } = readSubject();
    const list = await request.get(`${ApiBase}/passports/${passportId}/permalinks`, {
      headers: orgHeaders(orgId),
    });
    expect(list.ok()).toBeTruthy();
    const permalinks = items((await list.json()) as Listed<Permalink>);
    expect(permalinks.length, "the published subject has permalinks").toBeGreaterThan(0);
    for (const permalink of permalinks) {
      const renamed = await request.patch(`${ApiBase}/permalinks/${permalink.id}`, {
        headers: orgHeaders(orgId),
        data: { slug: `moved-${uniqueSerial("s").toLowerCase()}` },
      });
      expect(renamed.status(), `re-slugging ${permalink.publicUrl} is refused`).toBe(409);
      const deleted = await request.delete(`${ApiBase}/permalinks/${permalink.id}`, {
        headers: orgHeaders(orgId),
      });
      expect(deleted.status(), `deleting ${permalink.publicUrl} is refused`).toBe(409);
    }
    const again = await request.get(`${ApiBase}/passports/${passportId}/permalinks`, {
      headers: orgHeaders(orgId),
    });
    const urls = items((await again.json()) as Listed<Permalink>).map((p) => p.publicUrl);
    expect(urls.sort()).toEqual(permalinks.map((p) => p.publicUrl).sort());
  },
);

check(
  {
    id: "identifiers.uris-ascii-rfc3986",
    title:
      "identifier URIs use 7-bit characters only and percent-encode everything outside the RFC 3986 unreserved set",
    criteria: ["EN18219-4.3.2(1)"],
  },
  async ({ request }) => {
    const subject = readSubject();
    // CSET-82 characters a URI path segment must percent-encode (/ & % " < >) and three it must keep (- . _).
    const batch = 'Q/1&2%3"<>-._';
    const draft = await draftPassport(request, subject.orgId);
    try {
      const created = await request.post(`${ApiBase}/unique-product-identifiers`, {
        headers: orgHeaders(subject.orgId),
        data: {
          referenceId: draft.passportId,
          gtin: subject.gtin,
          batch,
          serial: uniqueSerial("enc"),
        },
      });
      expect(created.status()).toBe(201);
      const { digitalLink } = (await created.json()) as { digitalLink: string };

      const list = await request.get(`${ApiBase}/passports/${subject.passportId}/permalinks`, {
        headers: orgHeaders(subject.orgId),
      });
      const permalinks = items((await list.json()) as Listed<Permalink>).map((p) => p.publicUrl);
      const uris = [digitalLink, subject.digitalLink, subject.publicUrl, ...permalinks];
      for (const uri of uris) {
        expect(uri, `${uri} is a URI of RFC 3986 characters only`).toMatch(RFC3986_URI);
      }
      const segment = new URL(digitalLink).pathname.split("/10/")[1]?.split("/21/")[0] ?? "";
      expect(segment, "no reserved or unsafe batch character stays raw").not.toMatch(/[/&"<>]/);
      expect(segment, "a percent sign only starts an escape").not.toMatch(/%(?![0-9A-F]{2})/);
      expect(segment, "unreserved characters stay as they are").toContain("-._");
      expect(decodeURIComponent(segment)).toBe(batch);
    } finally {
      await draft.remove();
    }
  },
);

check(
  {
    id: "identifiers.published-permalink-survives-config-deletion",
    title:
      "a published permalink keeps answering after the presentation configuration it names is deleted",
    criteria: [
      "EN18220-5.2.1-sub1",
      "EN18219-4.5.2(1)",
      "EN18219-4.2.2(1)",
      "ESPR-Art10(1)(a)",
      "BATT-Art13(6)(a)",
      "BATT-Art77(3)-sub1",
    ],
  },
  async ({ request, browser }) => {
    // A published passport cannot be deleted: the Check archives its own passport at the end, so each
    // run leaves one archived passport in the subject's organisation.
    const { orgId } = readSubject();
    const { passportId } = await draftPassport(request, orgId);
    const published = await request.put(`${ApiBase}/passports/${passportId}/status`, {
      headers: orgHeaders(orgId),
      data: { method: "Publish" },
    });
    expect(published.ok(), "the throwaway passport should be published").toBeTruthy();
    const anonymous = await newAnonymousContext(browser);
    try {
      const list = await request.get(`${ApiBase}/passports/${passportId}/permalinks`, {
        headers: orgHeaders(orgId),
      });
      const permalink = items(
        (await list.json()) as Listed<Permalink & { presentationConfigurationId?: string | null }>,
      ).find((p) => p.presentationConfigurationId);
      expect(permalink, "a new passport's permalink names its presentation configuration").toBeDefined();
      const before = await anonymous.request.get(`${ApiBase}/p/${permalink!.id}`);
      expect(before.status(), "the frozen permalink answers once published").toBe(200);

      const removed = await request.delete(
        `${ApiBase}/passports/${passportId}/presentation-configurations/${permalink!.presentationConfigurationId}`,
        { headers: orgHeaders(orgId) },
      );
      // Refusing the deletion keeps the permalink alive too; only a broken permalink fails the Check.
      if (removed.ok()) {
        const after = await anonymous.request.get(`${ApiBase}/p/${permalink!.id}`);
        expect(after.status(), `${permalink!.publicUrl} still answers`).toBe(200);
      }
    } finally {
      await anonymous.close();
      await request.put(`${ApiBase}/passports/${passportId}/status`, {
        headers: orgHeaders(orgId),
        data: { method: "Archive" },
      });
    }
  },
);
