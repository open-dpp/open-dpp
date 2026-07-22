import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { BulkImportRunStatusDto } from "@open-dpp/dto";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { BulkImportRun } from "./bulk-import-run";

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

  it("starts as pending", () => {
    const run = buildRun();
    expect(run.status).toEqual(BulkImportRunStatusDto.Pending);
  });

  it("moves to running once started", () => {
    const run = buildRun();
    run.start();
    expect(run.status).toEqual(BulkImportRunStatusDto.Running);
  });

  it("completes without errors when every item succeeded", () => {
    const run = buildRun();
    run.start();
    run.recordItemOutcome(true);
    run.recordItemOutcome(true);
    run.complete();
    expect(run.status).toEqual(BulkImportRunStatusDto.Completed);
    expect(run.succeededCount).toEqual(2);
    expect(run.failedCount).toEqual(0);
  });

  it("completes with errors when at least one item failed", () => {
    const run = buildRun();
    run.start();
    run.recordItemOutcome(true);
    run.recordItemOutcome(false);
    run.complete();
    expect(run.status).toEqual(BulkImportRunStatusDto.CompletedWithErrors);
    expect(run.failedCount).toEqual(1);
  });

  it("marks a still-running run as interrupted", () => {
    const run = buildRun();
    run.start();
    run.markInterrupted();
    expect(run.status).toEqual(BulkImportRunStatusDto.Interrupted);
    expect(run.isRunning()).toBeFalsy();
  });

  it("does not mark an already-completed run as interrupted", () => {
    const run = buildRun();
    run.start();
    run.complete();
    run.markInterrupted();
    expect(run.status).toEqual(BulkImportRunStatusDto.Completed);
  });

  it("round-trips through toPlain/fromPlain", () => {
    const run = buildRun();
    run.start();
    run.recordItemOutcome(true);
    const restored = BulkImportRun.fromPlain(run.toPlain());
    expect(restored.toPlain()).toEqual(run.toPlain());
  });
});
