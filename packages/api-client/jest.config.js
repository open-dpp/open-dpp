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
            decorators: true,
          },
          transform: {
            decoratorMetadata: true,
          },
        },
        module: {
          type: "commonjs",
        },
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!.*(@open-dpp|until-async|uuid|rettime))"],
  moduleNameMapper: {
    "^@open-dpp/(.*)$": "<rootDir>/../../packages/$1/src",
  },
  testEnvironment: "node",
};
