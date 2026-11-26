/**
 * Links all three legal documents for the spec that imports this module FIRST. `EnvModule.forRoot()`
 * validates env while the auth module is imported, so these must be set before any application
 * import. Vitest runs every test file in its own process, so nothing leaks.
 */
export const TEST_LEGAL_LINKS = {
  privacyPolicyUrl: "https://legal.example.com/privacy",
  termsOfServiceUrl: "https://legal.example.com/terms",
  imprintUrl: "https://legal.example.com/imprint",
};

process.env.OPEN_DPP_LEGAL_PRIVACY_POLICY_URL = TEST_LEGAL_LINKS.privacyPolicyUrl;
process.env.OPEN_DPP_LEGAL_TERMS_OF_SERVICE_URL = TEST_LEGAL_LINKS.termsOfServiceUrl;
process.env.OPEN_DPP_LEGAL_IMPRINT_URL = TEST_LEGAL_LINKS.imprintUrl;
