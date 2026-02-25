module.exports = {
  testRegex: ".*\\.spec\\.ts$",

  testEnvironment: "node",

  testTimeout: 60000,
  maxWorkers: "50%",
  detectOpenHandles: true,

  extensionsToTreatAsEsm: [".ts", ".tsx"],

  // Use SWC to transform both TS and JS (ESM from node_modules too)
  transform: {
    "^.+\\.([tj]sx?|mjs)$": [
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
    "node_modules/(?!.*(better-auth|@better-auth|better-call|better-fetch|jose|@noble|rou3|uuid))",
  ],

  moduleNameMapper: {
    "^@open-dpp/(.*)$": "<rootDir>/../../packages/$1/src",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  globalSetup: "<rootDir>/test/global-setup.ts",
  globalTeardown: "<rootDir>/test/global-teardown.ts",

  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/main.ts",
    "!src/**/*.module.ts",
    "!src/**/*.dto.ts",
    "!src/**/*.schema.ts",
    "!src/**/*.spec.ts",
    "!src/**/index.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov", "clover"],
};
