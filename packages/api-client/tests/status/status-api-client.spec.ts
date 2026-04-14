import { OpenDppClient, StatusApiClient } from "../../src";
import { statusResponse } from "./handlers";
import { server } from "./msw.server";

describe("statusApiClient", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const baseURL = "https://api.cloud.open-dpp.de";

  it("should return status with version", async () => {
    const client = new StatusApiClient({ baseURL });
    const response = await client.get();
    expect(response.data).toEqual(statusResponse);
  });

  it("should be accessible via OpenDppClient", async () => {
    const sdk = new OpenDppClient({
      dpp: { baseURL },
      status: { baseURL },
    });
    const response = await sdk.status.get();
    expect(response.data).toEqual(statusResponse);
  });
});
