// Ensure this file is parsed as a module regardless of dependencies.
export {};

type layout = "default" | "presentation" | "none";

declare module "vue-router" {
  interface RouteMeta {
    layout: layout;
    public?: boolean;
  }
}
