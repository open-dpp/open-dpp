import Select from "./Select.vue";

describe("<Select />", () => {
  it("shows options and selects one", () => {
    cy.mountWithPinia(Select, {
      props: {
        dataCy: "Select me",
        modelValue: {
          id: "opt1",
          label: "Label opt1",
        },
        options: [
          {
            id: "opt1",
            label: "Label opt1",
          },
          {
            id: "opt2",
            label: "Label opt2",
          },
        ],
      },
      attrs: {
        "onUpdate:modelValue": cy.spy().as("onUpdateModelValue"),
      },
    });

    // Select the second option
    cy.get("[data-cy=\"Select me\"]").select("Label opt2");

    // Verify that the update:modelValue event was emitted with the correct option
    cy.get("@onUpdateModelValue").should("have.been.calledWith", {
      id: "opt2",
      label: "Label opt2",
    });
  });
});
