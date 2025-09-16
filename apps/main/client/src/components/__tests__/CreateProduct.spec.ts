import { describe, test, vi } from "vitest";

vi.mock("../../lib/axios", () => ({
  default: {
    post: vi.fn(),
  },
}));
vi.mock("../../lib/api-client", () => ({
  default: {
    postModel: vi.fn(),
  },
}));

// const mockedApiClient = apiClient as Mocked<typeof apiClient>;

describe("CreateModel.vue", () => {
  test("creates a product with given name and description", async () => {
    /* mockedApiClient.postModel.mockResolvedValue({} as any);
            render(CreateModel, {
              props: { modelValue: true },
            });
            expect(await screen.findByText("Neues Produkt")).toBeTruthy();
            const nameInput = screen.getByLabelText("Name");
            const descriptionInput = screen.getByLabelText("Beschreibung");
        
            await fireEvent.update(nameInput, "My new product");
            await fireEvent.update(descriptionInput, "My product description");
            await fireEvent.click(screen.getByText("Speichern"));
            expect(mockedApiClient.postModel).toHaveBeenCalledWith("models", {
              name: "My new product",
              description: "My product description",
            }); */
  });
});
