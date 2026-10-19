import { afterAll, describe, expect, it } from "@jest/globals";
import http from "node:http";
import type { AddressInfo } from "node:net";
import request, { Test } from "supertest";

/**
 * Guards `test/setup-after-env.ts`: under the parallel full run, foreign IPv4-only
 * listeners on 127.0.0.1 intercept the ephemeral ports supertest picks, so supertest
 * has to talk to the IPv6 loopback whenever the server it started is dual-stack.
 */
describe("supertest loopback routing", () => {
  const remoteAddresses: string[] = [];
  const server = http
    .createServer((req, res) => {
      remoteAddresses.push(req.socket.remoteAddress ?? "");
      res.end("ok");
    })
    .listen(0);
  const address = server.address() as AddressInfo;
  const onDualStack = address.family === "IPv6" ? it : it.skip;
  const onIpv4Only = address.family === "IPv4" ? it : it.skip;

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  onDualStack("targets the IPv6 loopback of a dual-stack server", () => {
    const test = new Test(server, "get", "/probe");

    expect(test.url).toBe(`http://[::1]:${address.port}/probe`);
  });

  onDualStack("reaches the server from ::1, where no IPv4 listener can intercept", async () => {
    const response = await request(server).get("/whoami");

    expect(response.status).toBe(200);
    expect(remoteAddresses.at(-1)).toBe("::1");
  });

  onIpv4Only("keeps supertest's IPv4 loopback when the host has no IPv6", () => {
    const test = new Test(server, "get", "/probe");

    expect(test.url).toBe(`http://127.0.0.1:${address.port}/probe`);
  });
});
