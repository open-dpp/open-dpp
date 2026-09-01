import { computed, ref } from "vue";

export interface ActivityHistoryStackEntry {
  queryPath: string;
  displayPath: string;
  endDate: string;
}

export interface UseActivityHistoryStackOptions {
  livePath: () => string | undefined;
  initialPeriod: (Date | null)[];
  changePeriod: (
    period: (Date | null)[],
    options?: { pushToUrl?: boolean },
  ) => Promise<void> | void;
}

/**
 * Tracks the stack of historical entries a move-activity's "view history before
 * this move" link can push the user into: each entry bounds the activity query to
 * an element's earlier idShortPath, up to the moment it was moved away from it.
 * Index -1 is always "live" (the current path, no time bound).
 */
export function useActivityHistoryStack(options: UseActivityHistoryStackOptions) {
  const historyStack = ref<ActivityHistoryStackEntry[]>([]);
  const livePeriod = ref<(Date | null)[]>([...options.initialPeriod]);

  const currentPath = computed(
    () => historyStack.value[historyStack.value.length - 1]?.queryPath ?? options.livePath(),
  );
  const selectedIndex = computed(() => historyStack.value.length - 1);

  async function goToEntry(index: number) {
    if (index < 0) {
      historyStack.value = [];
      await options.changePeriod(livePeriod.value, { pushToUrl: false });
    } else {
      historyStack.value = historyStack.value.slice(0, index + 1);
      const entry = historyStack.value[index]!;
      await options.changePeriod([null, new Date(entry.endDate)], { pushToUrl: false });
    }
  }

  async function viewHistoryBeforeMove(payload: ActivityHistoryStackEntry) {
    historyStack.value = [...historyStack.value, payload];
    await options.changePeriod([null, new Date(payload.endDate)], { pushToUrl: false });
  }

  function resetToLive(freshPeriod: (Date | null)[]) {
    livePeriod.value = freshPeriod;
    historyStack.value = [];
  }

  return {
    historyStack,
    currentPath,
    selectedIndex,
    goToEntry,
    viewHistoryBeforeMove,
    resetToLive,
  };
}
