import { expect } from "@jest/globals";
import { archiveDpp, DppStatus, DppStatusChange, publishDpp, restoreDpp } from "./dpp-status";

describe("dppStatus", () => {
  it("should be published", () => {
    const statusChange = publishDpp(
      DppStatusChange.create({
        currentStatus: DppStatus.Draft,
      }),
    );
    expect(statusChange.previousStatus).toEqual(DppStatus.Draft);
    expect(statusChange.currentStatus).toEqual(DppStatus.Published);

    expect(() =>
      publishDpp(
        DppStatusChange.create({
          currentStatus: DppStatus.Published,
        }),
      ),
    ).toThrow("Only drafts can be published.");
  });

  it("should be archived", () => {
    let statusChange = archiveDpp(
      DppStatusChange.create({
        currentStatus: DppStatus.Draft,
      }),
    );
    expect(statusChange.previousStatus).toEqual(DppStatus.Draft);
    expect(statusChange.currentStatus).toEqual(DppStatus.Archived);

    statusChange = archiveDpp(
      DppStatusChange.create({
        currentStatus: DppStatus.Published,
      }),
    );
    expect(statusChange.previousStatus).toEqual(DppStatus.Published);
    expect(statusChange.currentStatus).toEqual(DppStatus.Archived);

    expect(() =>
      archiveDpp(
        DppStatusChange.create({
          currentStatus: DppStatus.Archived,
        }),
      ),
    ).toThrow("A dpp can only archived once.");
  });

  it("should be restored", () => {
    let statusChange = restoreDpp(
      DppStatusChange.create({
        previousStatus: DppStatus.Draft,
        currentStatus: DppStatus.Archived,
      }),
    );
    expect(statusChange.previousStatus).toEqual(DppStatus.Archived);
    expect(statusChange.currentStatus).toEqual(DppStatus.Draft);

    statusChange = restoreDpp(
      DppStatusChange.create({
        previousStatus: DppStatus.Published,
        currentStatus: DppStatus.Archived,
      }),
    );
    expect(statusChange.previousStatus).toEqual(DppStatus.Archived);
    expect(statusChange.currentStatus).toEqual(DppStatus.Published);

    statusChange = restoreDpp(
      DppStatusChange.create({
        currentStatus: DppStatus.Archived,
      }),
    );
    expect(statusChange.previousStatus).toEqual(DppStatus.Archived);
    expect(statusChange.currentStatus).toEqual(DppStatus.Published);

    expect(() =>
      restoreDpp(
        DppStatusChange.create({
          currentStatus: DppStatus.Archived,
        }),
      ),
    ).toThrow("No previous status to restore from.");

    expect(() =>
      restoreDpp(
        DppStatusChange.create({
          previousStatus: DppStatus.Archived,
          currentStatus: DppStatus.Archived,
        }),
      ),
    ).toThrow("Cannot restore to the archived status.");
  });
});
