import { describe, expect, it, vi } from "vitest";
import { useActivityHistoryStack } from "./activity-history-stack.ts";

describe("activity-history-stack", () => {
  const livePath = () => "X.A";
  const initialPeriod = [new Date("2026-01-01"), new Date("2026-02-01")];

  it("starts live, scoped to the live path with no time bound", () => {
    const changePeriod = vi.fn();
    const { currentPath, selectedIndex, historyStack } = useActivityHistoryStack({
      livePath,
      initialPeriod,
      changePeriod,
    });

    expect(currentPath.value).toBe("X.A");
    expect(selectedIndex.value).toBe(-1);
    expect(historyStack.value).toEqual([]);
    expect(changePeriod).not.toHaveBeenCalled();
  });

  it("pushes an entry when viewing history before a move, bounding the period without touching the URL", async () => {
    const changePeriod = vi.fn();
    const { currentPath, selectedIndex, historyStack, viewHistoryBeforeMove } =
      useActivityHistoryStack({ livePath, initialPeriod, changePeriod });

    await viewHistoryBeforeMove({
      movedFromPath: "A",
      movedToPath: "X.A",
      dateOfMove: "2026-03-01T00:00:00.000Z",
    });

    expect(currentPath.value).toBe("A");
    expect(selectedIndex.value).toBe(0);
    expect(historyStack.value).toEqual([
      { movedFromPath: "A", movedToPath: "X.A", dateOfMove: "2026-03-01T00:00:00.000Z" },
    ]);
    expect(changePeriod).toHaveBeenCalledWith([null, new Date("2026-03-01T00:00:00.000Z")], {
      pushToUrl: false,
    });
  });

  it("supports chaining through several moves, one entry per move", async () => {
    const changePeriod = vi.fn();
    const { currentPath, selectedIndex, viewHistoryBeforeMove } = useActivityHistoryStack({
      livePath,
      initialPeriod,
      changePeriod,
    });

    await viewHistoryBeforeMove({
      movedFromPath: "A",
      movedToPath: "X.A",
      dateOfMove: "2026-03-01T00:00:00.000Z",
    });
    await viewHistoryBeforeMove({
      movedFromPath: "Y.C",
      movedToPath: "A",
      dateOfMove: "2026-02-01T00:00:00.000Z",
    });

    expect(currentPath.value).toBe("Y.C");
    expect(selectedIndex.value).toBe(1);
    expect(changePeriod).toHaveBeenLastCalledWith([null, new Date("2026-02-01T00:00:00.000Z")], {
      pushToUrl: false,
    });
  });

  it("jumps directly to an earlier entry and drops everything deeper than it", async () => {
    const changePeriod = vi.fn();
    const { currentPath, selectedIndex, historyStack, viewHistoryBeforeMove, goToEntry } =
      useActivityHistoryStack({ livePath, initialPeriod, changePeriod });

    await viewHistoryBeforeMove({
      movedFromPath: "A",
      movedToPath: "X.A",
      dateOfMove: "2026-03-01T00:00:00.000Z",
    });
    await viewHistoryBeforeMove({
      movedFromPath: "Y.C",
      movedToPath: "A",
      dateOfMove: "2026-02-01T00:00:00.000Z",
    });

    await goToEntry(0);

    expect(currentPath.value).toBe("A");
    expect(selectedIndex.value).toBe(0);
    expect(historyStack.value).toEqual([
      { movedFromPath: "A", movedToPath: "X.A", dateOfMove: "2026-03-01T00:00:00.000Z" },
    ]);
    expect(changePeriod).toHaveBeenLastCalledWith([null, new Date("2026-03-01T00:00:00.000Z")], {
      pushToUrl: false,
    });
  });

  it("returns to live (path and period) when going to index -1", async () => {
    const changePeriod = vi.fn();
    const { currentPath, selectedIndex, historyStack, viewHistoryBeforeMove, goToEntry } =
      useActivityHistoryStack({ livePath, initialPeriod, changePeriod });

    await viewHistoryBeforeMove({
      movedFromPath: "A",
      movedToPath: "X.A",
      dateOfMove: "2026-03-01T00:00:00.000Z",
    });
    await goToEntry(-1);

    expect(currentPath.value).toBe("X.A");
    expect(selectedIndex.value).toBe(-1);
    expect(historyStack.value).toEqual([]);
    expect(changePeriod).toHaveBeenLastCalledWith(initialPeriod, { pushToUrl: false });
  });

  it("resetToLive clears the stack and adopts a fresh live period for the next live visit", async () => {
    const changePeriod = vi.fn();
    const {
      currentPath,
      selectedIndex,
      historyStack,
      viewHistoryBeforeMove,
      goToEntry,
      resetToLive,
    } = useActivityHistoryStack({ livePath, initialPeriod, changePeriod });

    await viewHistoryBeforeMove({
      movedFromPath: "A",
      movedToPath: "X.A",
      dateOfMove: "2026-03-01T00:00:00.000Z",
    });

    const freshPeriod = [new Date("2026-06-01"), new Date("2026-07-01")];
    resetToLive(freshPeriod);

    expect(historyStack.value).toEqual([]);
    expect(currentPath.value).toBe("X.A");
    expect(selectedIndex.value).toBe(-1);

    await goToEntry(-1);
    expect(changePeriod).toHaveBeenLastCalledWith(freshPeriod, { pushToUrl: false });
  });
});
