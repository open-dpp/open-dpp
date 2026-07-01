module.exports = {
  testRegex: ".*\\.spec\\.ts$",

  testEnvironment: "node",

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
  // Integration suites build a full NestJS module + Mongoose connections in beforeAll.
  // Under the full parallel suite (~130 suites contending for CPU/IO) that setup can
  // exceed a 20s ceiling on contended machines, even though each suite runs in ~8s in
  // isolation. 45s gives headroom without masking a genuinely hung test.
  testTimeout: 45000,
};
