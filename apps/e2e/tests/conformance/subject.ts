/**
 * The conformance subject: one published passport with a GS1 identity, created once by
 * conformance.setup.ts and read by every Check, plus a draft twin for "must stay hidden" Checks.
 */
import fs from "node:fs";
import path from "node:path";

export const SUBJECT_FILE = path.join(__dirname, "../../playwright/.conformance/subject.json");

export type Subject = {
  orgId: string;
  passportId: string;
  gtin: string;
  serial: string;
  /** Public presentation URL the GS1 scan redirects to (`…/p/<id>`). */
  publicUrl: string;
  /** GS1 Digital Link URI the instance reports for the passport. */
  digitalLink: string;
  draft: { passportId: string; serial: string };
};

export const writeSubject = (subject: Subject): void => {
  fs.mkdirSync(path.dirname(SUBJECT_FILE), { recursive: true });
  fs.writeFileSync(SUBJECT_FILE, JSON.stringify(subject, null, 2));
};

export const readSubject = (): Subject => {
  if (!fs.existsSync(SUBJECT_FILE)) {
    throw new Error(
      `no conformance subject at ${SUBJECT_FILE}: run the conformance-setup project first`,
    );
  }
  return JSON.parse(fs.readFileSync(SUBJECT_FILE, "utf8")) as Subject;
};

/** Flat string map for the Check report. */
export const subjectSummary = (subject: Subject): Record<string, string> => ({
  passportId: subject.passportId,
  gtin: subject.gtin,
  serial: subject.serial,
  publicUrl: subject.publicUrl,
  draftPassportId: subject.draft.passportId,
});
