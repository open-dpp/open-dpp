import antfu from '@antfu/eslint-config'

export default function createConfig(options, userConfigs) {
  return antfu({
    type: 'app',
    typescript: true,
    formatters: true,
    stylistic: {
      indent: 2,
      semi: true,
      quotes: 'double',
    },
    ...options,
  }, {
    rules: {
      'no-console': ['warn'],
    },
    ...userConfigs,
  })
}
