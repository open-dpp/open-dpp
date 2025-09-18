import type { BaseMountingOptions } from '@vue/test-utils';

declare global {
  namespace Cypress {
    interface Chainable {
      mountWithPinia<T>(
        component: T,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        options?: BaseMountingOptions<T> & { router?: Router },
      ): Cypress.Chainable;
      mount<T>(component: T, options?: BaseMountingOptions<T>): Chainable<void>;
      expectDeepEqualWithDiff(
        actual: unknown,
        expected: unknown,
      ): Chainable<void>;
    }
  }
}
