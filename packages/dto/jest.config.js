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
  testEnvironment: 'node',
}
