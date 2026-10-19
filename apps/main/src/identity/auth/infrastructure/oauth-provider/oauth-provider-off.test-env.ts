/**
 * Forces the OAuth Provider OFF for the spec that imports this module FIRST, whatever the
 * developer's `.env.dev` says (a local instance may keep it on for manual acceptance). The
 * auth module validates env while it is being imported, so this must precede any
 * application import. Jest hands every test file its own copy of `process.env`.
 */
process.env.OPEN_DPP_OAUTH_PROVIDER_ENABLED = "false";
