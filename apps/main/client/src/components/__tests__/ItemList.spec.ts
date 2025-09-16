import { describe, expect, test } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/vue";
import ItemList from "../items/ItemList.vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { routes } from "../../router";
import { createPinia } from "pinia";
import { ItemDto } from "@open-dpp/api-client";

const pinia = createPinia();
const router = createRouter({
  history: createMemoryHistory(),
  routes: routes,
});

describe("ItemList.vue", () => {
  test("should render items", async () => {
    const items: Array<ItemDto> = [
      {
        id: "id1",
        templateId: "1",
        uniqueProductIdentifiers: [{ uuid: "2", referenceId: "3" }],
        dataValues: [],
      },
      {
        id: "id2",
        templateId: "5",
        uniqueProductIdentifiers: [{ uuid: "6", referenceId: "7" }],
        dataValues: [],
      },
    ];
    render(ItemList, {
      props: {
        items,
      },
      global: {
        plugins: [pinia, router],
      },
    });
    expect(screen.getByText("Artikelpässe")).toBeTruthy();
    expect(screen.getByText("Alle Pässe auf Einzelartikelebene.")).toBeTruthy();

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    const headerCells = within(rows[0]).getAllByRole("columnheader");
    expect(headerCells.map((h) => h.textContent)).toEqual(["ID", "Aktionen"]);

    rows.slice(1).forEach((row, index) => {
      const cells = within(row).getAllByRole("cell");
      expect(cells[0].textContent).toEqual(
        items[index].uniqueProductIdentifiers[0].uuid,
      );
      expect(cells[1].textContent).toEqual("EditierenQR-Code");
    });
  });
  test("should create item", async () => {
    const items: Array<ItemDto> = [
      {
        id: "id1",
        templateId: "1",
        uniqueProductIdentifiers: [{ uuid: "2", referenceId: "3" }],
        dataValues: [],
      },
      {
        id: "id2",
        templateId: "5",
        uniqueProductIdentifiers: [{ uuid: "6", referenceId: "7" }],
        dataValues: [],
      },
    ];
    const { emitted } = render(ItemList, {
      props: {
        items,
      },
      global: {
        plugins: [pinia, router],
      },
    });
    const createButton = screen.getByRole("button", {
      name: "Artikelpass hinzufügen",
    });
    await fireEvent.click(createButton);

    expect(emitted().add[0]).toEqual([]);
  });
});
