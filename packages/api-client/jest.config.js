export default {
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2022',
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            decoratorMetadata: true,
          },
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((?:\\.pnpm/.*?/)?(?:@(?:open-dpp)|until-async|uuid))(?:/|$))',
  ],
  moduleNameMapper: {
    '^@open-dpp/(.*)$': '<rootDir>/../../packages/$1/src',
  },
  testEnvironment: 'node',
}
