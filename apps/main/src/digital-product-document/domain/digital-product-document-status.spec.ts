import { expect } from "@jest/globals";
import {
  archiveDpp,
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
  publishDpp,
  restoreDpp,
} from "./digital-product-document-status";

describe("dppStatus", () => {
  it("should be published", () => {
    const statusChange = publishDpp(
      DigitalProductDocumentStatusChange.create({
        currentStatus: DigitalProductDocumentStatus.Draft,
      }),
    );
    expect(statusChange.previousStatus).toEqual(DigitalProductDocumentStatus.Draft);
    expect(statusChange.currentStatus).toEqual(DigitalProductDocumentStatus.Published);

    expect(() =>
      publishDpp(
        DigitalProductDocumentStatusChange.create({
          currentStatus: DigitalProductDocumentStatus.Published,
        }),
      ),
    ).toThrow("Only drafts can be published.");
  });

  it("should be archived", () => {
    let statusChange = archiveDpp(
      DigitalProductDocumentStatusChange.create({
        currentStatus: DigitalProductDocumentStatus.Draft,
      }),
    );
    expect(statusChange.previousStatus).toEqual(DigitalProductDocumentStatus.Draft);
    expect(statusChange.currentStatus).toEqual(DigitalProductDocumentStatus.Archived);

    statusChange = archiveDpp(
      DigitalProductDocumentStatusChange.create({
        currentStatus: DigitalProductDocumentStatus.Published,
      }),
    );
    expect(statusChange.previousStatus).toEqual(DigitalProductDocumentStatus.Published);
    expect(statusChange.currentStatus).toEqual(DigitalProductDocumentStatus.Archived);

    expect(() =>
      archiveDpp(
        DigitalProductDocumentStatusChange.create({
          currentStatus: DigitalProductDocumentStatus.Archived,
        }),
      ),
    ).toThrow("A dpp can only archived once.");
  });

  it("should be restored", () => {
    let statusChange = restoreDpp(
      DigitalProductDocumentStatusChange.create({
        previousStatus: DigitalProductDocumentStatus.Draft,
        currentStatus: DigitalProductDocumentStatus.Archived,
      }),
    );
    expect(statusChange.previousStatus).toEqual(DigitalProductDocumentStatus.Archived);
    expect(statusChange.currentStatus).toEqual(DigitalProductDocumentStatus.Draft);

    statusChange = restoreDpp(
      DigitalProductDocumentStatusChange.create({
        previousStatus: DigitalProductDocumentStatus.Published,
        currentStatus: DigitalProductDocumentStatus.Archived,
      }),
    );
    expect(statusChange.previousStatus).toEqual(DigitalProductDocumentStatus.Archived);
    expect(statusChange.currentStatus).toEqual(DigitalProductDocumentStatus.Published);

    expect(() =>
      restoreDpp(
        DigitalProductDocumentStatusChange.create({
          currentStatus: DigitalProductDocumentStatus.Archived,
        }),
      ),
    ).toThrow("No previous status to restore from.");

    expect(() =>
      restoreDpp(
        DigitalProductDocumentStatusChange.create({
          previousStatus: DigitalProductDocumentStatus.Archived,
          currentStatus: DigitalProductDocumentStatus.Archived,
        }),
      ),
    ).toThrow("Cannot restore to the archived status.");
  });
});
