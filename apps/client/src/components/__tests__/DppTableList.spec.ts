import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import { describe, expect } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { routes } from "../../router";
import { i18n } from "../../translations/i18n.ts";
import DppTable from "../DppTable.vue";

const pinia = createPinia();
const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

describe("dppTableList.vue", () => {
  it("should call create event if add button is clicked", async () => {
    const { emitted } = render(DppTable, {
      props: {
        items: [],
        title: "Passvorlagen",
      },
      global: {
        plugins: [PrimeVue, pinia, router, i18n],
      },
    });
    await fireEvent.click(screen.getByText("Hinzufügen"));
    await waitFor(() => {
      expect(emitted().add).toBeTruthy();
    });
  });
});
