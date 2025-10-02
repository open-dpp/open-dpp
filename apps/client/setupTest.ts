import * as ResizeObserverModule from "resize-observer-polyfill";
import { beforeAll } from "vitest";

beforeAll(() => {
  (globalThis as any).ResizeObserver = ResizeObserverModule.default;
});
