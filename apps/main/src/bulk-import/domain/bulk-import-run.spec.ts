import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { BulkImportRunStatusDto } from "@open-dpp/dto";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { BulkImportRun } from "./bulk-import-run";
import { BulkImportRunItem } from "./bulk-import-run-item";

describe("BulkImportRun", () => {
  function buildRun(totalCount = 2) {
    return BulkImportRun.create({
      bulkImportConfigId: randomUUID(),
      organizationId: randomUUID(),
      subject: SubjectAttributes.create({ userRole: UserRole.USER }),
      userId: randomUUID(),
      totalCount,
    });
  }

  function buildRunItem(runId: string, rowIndex: number) {
    return BulkImportRunItem.create({
      runId,
      rowIndex,
      inputData: { sku: "4711" },
      externalId: "4711",
    });
  }

  it("starts as pending", () => {
    const run = buildRun();
    expect(run.status).toEqual(BulkImportRunStatusDto.Pending);
  });

  it("moves to running once started", () => {
    const run = buildRun();
    run.startOrResume([buildRunItem(run.id, 0)]);
    expect(run.status).toEqual(BulkImportRunStatusDto.Running);
  });

  it("completes without errors when every item succeeded", () => {
    const run = buildRun();

    run.startOrResume([buildRunItem(run.id, 0), buildRunItem(run.id, 1)]);
    run.recordItemOutcome(true);
    run.recordItemOutcome(true);
    run.complete();
    expect(run.status).toEqual(BulkImportRunStatusDto.Completed);
    expect(run.succeededCount).toEqual(2);
    expect(run.failedCount).toEqual(0);
  });

  it("completes with errors when at least one item failed", () => {
    const run = buildRun();
    const failed = buildRunItem(run.id, 1);
    failed.markFailed("error");
    run.startOrResume([buildRunItem(run.id, 0), failed]);
    run.recordItemOutcome(true);
    run.recordItemOutcome(false);
    run.complete();
    expect(run.status).toEqual(BulkImportRunStatusDto.CompletedWithErrors);
    expect(run.failedCount).toEqual(1);
  });

  it("marks a still-running run as interrupted", () => {
    const run = buildRun();
    run.startOrResume([buildRunItem(run.id, 0), buildRunItem(run.id, 1)]);
    run.markInterrupted();
    expect(run.status).toEqual(BulkImportRunStatusDto.Interrupted);
    expect(run.isRunning()).toBeFalsy();
  });

  it("does not mark an already-completed run as interrupted", () => {
    const run = buildRun();
    run.startOrResume([]);
    run.complete();
    run.markInterrupted();
    expect(run.status).toEqual(BulkImportRunStatusDto.Completed);
  });

  it("round-trips through toPlain/fromPlain", () => {
    const run = buildRun();
    run.startOrResume([]);
    run.recordItemOutcome(true);
    const restored = BulkImportRun.fromPlain(run.toPlain());
    expect(restored.toPlain()).toEqual(run.toPlain());
  });

  it("resumes a run", () => {
    const run = buildRun(5);
    const succeeded1 = buildRunItem(run.id, 0);
    const succeeded2 = buildRunItem(run.id, 1);
    const failed1 = buildRunItem(run.id, 2);
    const failed2 = buildRunItem(run.id, 3);
    const pending = buildRunItem(run.id, 4);
    const allItems = [succeeded1, failed1, succeeded2, failed2, pending];
    let pendingItems = run.startOrResume(allItems);
    expect(pendingItems).toEqual(allItems);
    succeeded1.markCreated(randomUUID());
    run.recordItemOutcome(true);
    failed1.markFailed("error");
    run.recordItemOutcome(false);
    // run is canceled due to a deployment, so succeeded2 and failed2 have been processed but their outcome has not been recorded
    succeeded2.markCreated(randomUUID());
    failed2.markFailed("error");
    expect(run.succeededCount).toEqual(1);
    expect(run.failedCount).toEqual(1);

    // resume the run
    pendingItems = run.startOrResume(allItems);
    expect(run.succeededCount).toEqual(2);
    expect(run.failedCount).toEqual(2);
    expect(pendingItems).toEqual([pending]);
  });
});
