export default {
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.([tj]sx?|mjs)$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2022",
          parser: {
            syntax: "typescript",
          },
        },
        module: {
          type: "commonjs",
        },
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!.*uuid)"],
  moduleNameMapper: {
    "^@open-dpp/(.*)$": "<rootDir>/../../packages/$1/src",
  },
  testEnvironment: "node",
};
