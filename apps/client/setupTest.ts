import { beforeAll } from 'vitest';
import * as ResizeObserverModule from 'resize-observer-polyfill';

beforeAll(() => {
  global.ResizeObserver = ResizeObserverModule.default;
});
