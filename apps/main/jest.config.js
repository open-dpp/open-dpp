module.exports = {
  // Run only this spec for now (matches your current intent)
  testRegex: "src/models/presentation/models.controller.spec.ts",

  testEnvironment: "node",

  extensionsToTreatAsEsm: [".ts", ".tsx"],

  // Use SWC to transform both TS and JS (ESM from node_modules too)
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2022",
          parser: { syntax: "typescript", tsx: false, decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
        },
        module: { type: "commonjs" },
      },
    ],
  },

  transformIgnorePatterns: [
    "node_modules/(?!(better-auth|@better-auth|better-call|better-fetch|jose)/)",
  ],

  moduleNameMapper: {
    "^@open-dpp/(.*)$": "<rootDir>/../../packages/$1/src",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  globalSetup: "<rootDir>/test/global-setup.ts",
  globalTeardown: "<rootDir>/test/global-teardown.ts",
};
