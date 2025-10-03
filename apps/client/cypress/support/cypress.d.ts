/// <reference types="cypress" />

import type { MountingOptions } from "cypress/vue";
import type { Component, DefineComponent, FunctionalComponent } from "vue";
import type { Router } from "vue-router";

type VueMountable = DefineComponent<any, any, any, any, any> | FunctionalComponent<any>;

declare global {
  namespace Cypress {
    interface MountWithPiniaOptions extends Omit<MountingOptions<any>, "global"> {
      // Allow passing a router that will be registered as a plugin
      router?: Router;
      // Keep access to the original global from MountingOptions
      global?: NonNullable<MountingOptions<any>["global"]>;
    }

    interface Chainable<Subject = any> {
      /**
       * Mount a Vue component with Pinia (and optional Vue Router) preconfigured.
       */
      mountWithPinia(
        component: VueMountable,
        options?: MountWithPiniaOptions
      ): Chainable<any>;

      /**
       * Assert deep equality and print a Jest-like diff when it fails.
       */
      expectDeepEqualWithDiff<T>(actual: T, expected: T): Chainable<void>;

      /**
       * Mount a Vue component using cypress/vue mount helper.
       */
      mount(
        component: Component,
        options?: MountingOptions<Component>
      ): Chainable<any>;
    }
  }
}

export {};
