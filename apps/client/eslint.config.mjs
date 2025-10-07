import createConfig from "@open-dpp/config-eslint/create-config";

export default createConfig({
  vue: true,
}, {
  rules: {
    "test/prefer-hooks-in-order": ["warn"],
  },
});
