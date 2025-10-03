/// <reference types="cypress" />
/// <reference path="./cypress.d.ts" />

// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import type { CyMountOptions } from "cypress/vue";
// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
import type { Pinia } from "pinia";
import type { App, Component, DefineComponent, FunctionalComponent } from "vue";
import type { Router } from "vue-router";
import {
  createAutoAnimatePlugin,
  createMultiStepPlugin,
} from "@formkit/addons";
import { de } from "@formkit/i18n";
import { genesisIcons } from "@formkit/icons";
import { defaultConfig, plugin as FormKit } from "@formkit/vue";
import { mount } from "cypress/vue";
import { diff } from "jest-diff";
import _ from "lodash";
import { createPinia, setActivePinia } from "pinia";
import { rootClasses } from "../../formkit.theme.js";
// Import commands.js using ES2015 syntax:
import "./commands.js";
import "../plugins/tailwind.js";

let pinia: Pinia;

// Run this code before each *test*.
beforeEach(() => {
  // New Pinia
  pinia = createPinia();

  // Set current Pinia instance
  setActivePinia(pinia);
});

type VueMountable = DefineComponent<any, any, any, any, any> | FunctionalComponent<any>;

type MountWithRouterOptions<C extends Component> = CyMountOptions<C> & {
  router?: Router;
};

Cypress.Commands.add(
  "mountWithPinia",
  <C extends VueMountable>(
    component: C,
    options: MountWithRouterOptions<C> = {} as MountWithRouterOptions<C>,
  ) => {
    const baseGlobal = (options.global ?? {}) as Exclude<
      CyMountOptions<C>["global"],
      undefined
    >;
    const basePlugins = (baseGlobal.plugins ?? []) as Exclude<
      Exclude<CyMountOptions<C>["global"], undefined>["plugins"],
      undefined
    >;

    const routerPlugin
      = options.router
        && ({
          install(app: App) {
            app.use(options.router as Router);
          },
        } as const);

    // Build a typed plugins array to avoid complex unions
    const plugins = [
      ...basePlugins,
      ...(routerPlugin ? [routerPlugin] : []),
      pinia,
      [
        FormKit,
        defaultConfig({
          config: { rootClasses },
          icons: { ...genesisIcons },
          locales: { de },
          locale: "de",
          plugins: [createMultiStepPlugin(), createAutoAnimatePlugin()],
        }),
      ],
    ] as Exclude<
      Exclude<CyMountOptions<C>["global"], undefined>["plugins"],
      undefined
    >;

    // Normalize options to a concrete MountingOptions to prevent union explosion
    const normalized = {
      ...(options as CyMountOptions<C>),
      global: {
        ...(baseGlobal as NonNullable<CyMountOptions<C>["global"]>),
        plugins,
      },
    } satisfies CyMountOptions<C>;

    // const RootWithSafelist = defineComponent({
    //   render() {
    //     return h("div", {}, [
    //       h(SafelistTailwindCss, { key: "safelist" }),
    //       h(component, { key: "component" }),
    //     ]);
    //   },
    // });

    return mount(component, normalized);
  },
);
Cypress.Commands.add("mount", mount);

Cypress.Commands.add("expectDeepEqualWithDiff", (actual, expected) => {
  if (!_.isEqual(actual, expected)) {
    console.warn("🔍 Deep diff:\n", diff(expected, actual));
  }
  expect(actual).to.deep.equal(expected);
});
