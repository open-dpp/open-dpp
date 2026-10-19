import type http from "node:http";
import type { AddressInfo } from "node:net";
import { Server as TlsServer } from "node:tls";
import { Test } from "supertest";

/**
 * Routes every supertest request through the IPv6 loopback.
 *
 * supertest starts the Nest server with `listen(0)`, which binds the dual-stack wildcard
 * `::` on an ephemeral port, and then sends the request to `http://127.0.0.1:<port>`.
 * macOS hands out ephemeral ports for `::` without checking who already holds
 * `127.0.0.1:<port>`, so under the parallel full run a request now and then reaches a
 * foreign IPv4-only listener (IDE helpers, device daemons): a non-HTTP one answers
 * `Parse Error: Expected HTTP/`, an HTTP one answers a random 404 or 401. A connection to
 * `[::1]` cannot be intercepted by those listeners. When the host has no IPv6, Node binds
 * `0.0.0.0` instead and supertest's own `127.0.0.1` stays in place.
 *
 * Mirrors supertest 7.2.2 `lib/test.js` `serverAddress`, including the `_server` handle
 * supertest closes after each request. `test/supertest-loopback.spec.ts` guards it.
 */
type ListeningTest = Test & { _server?: http.Server };

if (typeof Test.prototype.serverAddress !== "function") {
  throw new Error(
    "supertest no longer exposes Test.prototype.serverAddress; revisit test/setup-after-env.ts",
  );
}

Test.prototype.serverAddress = function (this: ListeningTest, app, path) {
  const server = app as http.Server;
  if (!server.address()) {
    this._server = server.listen(0);
  }
  const { port, family } = server.address() as AddressInfo;
  const host = family === "IPv6" ? "[::1]" : "127.0.0.1";
  const protocol = server instanceof TlsServer ? "https" : "http";
  return `${protocol}://${host}:${port}${path}`;
};
