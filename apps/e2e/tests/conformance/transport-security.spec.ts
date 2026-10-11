/** Transport security: the public view is served with HTTPS hardening headers, TLS 1.2+ and HTTP/2. */
import tls from "node:tls";
import { EnvConfig } from "../config";
import { newAnonymousContext } from "../helpers/anonymous";
import { check, expect } from "./checks";
import { readSubject } from "./subject";
import { test } from "../fixtures";

const skipOnPlainHttp = (what: string): void =>
  test.skip(
    !EnvConfig.OPEN_DPP_URL.startsWith("https://"),
    `instance under test is served over plain http; ${what} only applies to HTTPS deployments`,
  );

/** Completes a TLS handshake with the Instance under test and reports what was negotiated. */
const handshake = (
  options: tls.ConnectionOptions,
): Promise<{ protocol: string | null; alpn: string | false | null }> =>
  new Promise((resolve, reject) => {
    const origin = new URL(EnvConfig.OPEN_DPP_URL);
    const socket = tls.connect(
      {
        host: origin.hostname,
        port: Number(origin.port || 443),
        servername: origin.hostname,
        ...options,
      },
      () => {
        const negotiated = { protocol: socket.getProtocol(), alpn: socket.alpnProtocol };
        socket.end();
        resolve(negotiated);
      },
    );
    socket.once("error", reject);
  });

check(
  {
    id: "transport.hsts-on-public-view",
    title: "the public view answers with Strict-Transport-Security over HTTPS",
    criteria: ["ESPR-Art11(g)", "BATT-Art78(g)", "EN18239-6.5.2-sub1"],
  },
  async ({ browser }) => {
    skipOnPlainHttp("HSTS");
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const response = await anonymous.request.get(subject.publicUrl);
    expect(response.headers()["strict-transport-security"]).toMatch(/max-age=\d+/);
    await anonymous.close();
  },
);

check(
  {
    id: "transport.tls-1-2-minimum",
    title: "the instance negotiates TLS 1.2 or newer and refuses TLS 1.0 and 1.1",
    criteria: ["EN18216-4(4)"],
  },
  async () => {
    skipOnPlainHttp("the TLS version floor");
    const modern = await handshake({ minVersion: "TLSv1.2" });
    expect(["TLSv1.2", "TLSv1.3"]).toContain(modern.protocol);
    // SECLEVEL=0 lets the client offer the legacy versions at all; the server must still refuse them.
    await expect(
      handshake({ minVersion: "TLSv1", maxVersion: "TLSv1.1", ciphers: "DEFAULT@SECLEVEL=0" }),
    ).rejects.toThrow();
  },
);

check(
  {
    id: "transport.http2-offered",
    title: "the instance offers HTTP/2 (ALPN h2) over TLS",
    criteria: ["EN18216-4(5)"],
  },
  async () => {
    skipOnPlainHttp("HTTP/2 over TLS");
    const negotiated = await handshake({ minVersion: "TLSv1.2", ALPNProtocols: ["h2"] });
    expect(negotiated.alpn).toBe("h2");
  },
);
