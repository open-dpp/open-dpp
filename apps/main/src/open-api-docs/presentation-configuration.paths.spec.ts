import { presentationConfigurationPaths } from "./presentation-configuration.paths";

describe("presentationConfigurationPaths", () => {
  it("should export passport presentation-configurations list/create paths", () => {
    expect(presentationConfigurationPaths).toHaveProperty(
      "/passports/{id}/presentation-configurations",
    );
    const path = presentationConfigurationPaths["/passports/{id}/presentation-configurations"];
    expect(path).toHaveProperty("get");
    expect(path).toHaveProperty("post");
  });

  it("should export passport presentation-configurations get/patch/delete by id paths", () => {
    expect(presentationConfigurationPaths).toHaveProperty(
      "/passports/{id}/presentation-configurations/{configId}",
    );
    const path =
      presentationConfigurationPaths["/passports/{id}/presentation-configurations/{configId}"];
    expect(path).toHaveProperty("get");
    expect(path).toHaveProperty("patch");
    expect(path).toHaveProperty("delete");
  });

  it("should export passport effective presentation-configuration GET path", () => {
    expect(presentationConfigurationPaths).toHaveProperty(
      "/passports/{id}/presentation-configuration",
    );
    const path = presentationConfigurationPaths["/passports/{id}/presentation-configuration"];
    expect(path).toHaveProperty("get");
  });

  it("should export template presentation-configurations list/create paths", () => {
    expect(presentationConfigurationPaths).toHaveProperty(
      "/templates/{id}/presentation-configurations",
    );
    const path = presentationConfigurationPaths["/templates/{id}/presentation-configurations"];
    expect(path).toHaveProperty("get");
    expect(path).toHaveProperty("post");
  });

  it("should export template presentation-configurations get/patch/delete by id paths", () => {
    expect(presentationConfigurationPaths).toHaveProperty(
      "/templates/{id}/presentation-configurations/{configId}",
    );
    const path =
      presentationConfigurationPaths["/templates/{id}/presentation-configurations/{configId}"];
    expect(path).toHaveProperty("get");
    expect(path).toHaveProperty("patch");
    expect(path).toHaveProperty("delete");
  });

  it("should export template effective presentation-configuration GET path", () => {
    expect(presentationConfigurationPaths).toHaveProperty(
      "/templates/{id}/presentation-configuration",
    );
    const path = presentationConfigurationPaths["/templates/{id}/presentation-configuration"];
    expect(path).toHaveProperty("get");
  });
});
