import { createPinia, setActivePinia } from "pinia";
import { expect, it, vi } from "vitest";
import { useAasConnectionStore } from "./aas.connection";
import {
  AasConnectionGetAllDto,
  AssetAdministrationShellType,
  CreateAasConnectionDto,
} from "@open-dpp/api-client";
import { waitFor } from "@testing-library/vue";
import apiClient from "../lib/api-client";

const mocks = vi.hoisted(() => {
  return {
    getAllConnections: vi.fn(),
    createConnection: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      aasIntegration: {
        getAllConnections: mocks.getAllConnections,
        createConnection: mocks.createConnection,
      },
    },
  },
}));

describe("AasConnectionStore", () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
  });

  it("should fetch all connections", async () => {
    const aasConnectionStore = useAasConnectionStore();
    const mockedConnections: AasConnectionGetAllDto[] = [
      {
        id: "con1",
        name: "Connection 1",
      },
      {
        id: "con2",
        name: "Connection 2",
      },
    ];
    mocks.getAllConnections.mockResolvedValue({ data: mockedConnections });
    await aasConnectionStore.fetchConnections();
    expect(aasConnectionStore.aasConnections).toEqual(mockedConnections);
  });

  it("should create connection", async () => {
    const aasConnectionStore = useAasConnectionStore();
    const mockedConnection: CreateAasConnectionDto = {
      name: "Connection 1",
      aasType: AssetAdministrationShellType.Truck,
      dataModelId: "dtm1",
      modelId: "m1",
      fieldAssignments: [],
    };

    mocks.createConnection.mockResolvedValue({
      data: mockedConnection,
      status: 201,
    });
    const result = await aasConnectionStore.createConnection(mockedConnection);
    await waitFor(() =>
      expect(
        apiClient.dpp.aasIntegration.createConnection,
      ).toHaveBeenCalledWith(mockedConnection),
    );
    expect(result).toEqual(mockedConnection);
  });
});
